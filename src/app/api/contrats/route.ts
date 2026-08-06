import prisma from "@/lib/db";
import { Contract, Entries } from "@/lib/types";
import { NextResponse } from "next/server";
import { checkAndResetYearIfNeeded } from "@/utils/resetCAYear";
import { recomputeCAForYear } from "@/utils/historiqueCA";
import { calculRetrocession } from "@/utils/calculs";
import { round2 } from "@/utils/decoupageSeuil";
import { ApimoError, fetchApimoAll } from "@/utils/apimo";
import { memeJour, memeMontant, runChunked } from "@/utils/sync";

export const dynamic = "force-dynamic";
// Cron Vercel : la route doit pouvoir dépasser la durée par défaut si un gros
// rattrapage est nécessaire (ex. première exécution après plusieurs jours d'arrêt).
export const maxDuration = 300;

export async function GET() {
  const debut = Date.now();
  try {
    // Vérifier si une réinitialisation annuelle est nécessaire
    await checkAndResetYearIfNeeded();

    const contracts = await fetchApimoAll<Contract>("contracts", "contracts");
    const currentYear = new Date().getFullYear();

    // Contrats retenus : step 4, champs obligatoires présents, année en cours
    // ou précédente. Le filtrage est fait ici (avant toute requête DB) pour ne
    // jamais payer de round-trip sur un contrat qui sera ignoré.
    let invalides = 0;
    const eligibles = contracts.filter((contrat) => {
      if (contrat.step !== "4") return false;
      const { id, property, commission_agency, contract_at } = contrat;
      if (!id || !property || !commission_agency || !contract_at) {
        invalides++;
        return false;
      }
      return new Date(contract_at).getFullYear() >= currentYear - 1;
    });

    console.log(
      `📊 ${contracts.length} contrats Apimo → ${eligibles.length} éligibles (step 4, ${
        currentYear - 1
      }-${currentYear})` + (invalides ? `, ${invalides} invalides ignorés` : "")
    );

    // ---------------------------------------------------------------------
    // 1. Préchargement : 4 requêtes au lieu d'un SELECT par contrat/entry.
    // ---------------------------------------------------------------------
    const idsContratsApimo = eligibles.map((c) => Number(c.id));
    const idsRelationsApimo: number[] = [];
    for (const contrat of eligibles) {
      for (const entry of contrat.entries ?? []) {
        if (entry.id) idsRelationsApimo.push(Number(entry.id));
      }
    }

    const [utilisateurs, contratsExistants, relationsExistantes, historiques] =
      await Promise.all([
        prisma.utilisateurs.findMany({
          select: {
            id: true,
            idapimo: true,
            prenom: true,
            nom: true,
            typecontrat: true,
            auto_parrain: true,
            chiffre_affaires: true,
            retrocession: true,
          },
        }),
        prisma.contrats.findMany({
          where: { idcontratapimo: { in: idsContratsApimo } },
          select: {
            id: true,
            idcontratapimo: true,
            statut: true,
            property_id: true,
            honoraires: true,
            date_signature: true,
          },
        }),
        prisma.relations_contrats.findMany({
          where: { idrelationapimo: { in: idsRelationsApimo } },
          select: {
            idrelationapimo: true,
            honoraires_agent: true,
            vat: true,
            vat_rate: true,
          },
        }),
        prisma.historique_ca_annuel.findMany({
          where: { annee: { in: [currentYear - 1, currentYear] } },
          select: {
            user_id: true,
            annee: true,
            chiffre_affaires: true,
            retrocession_finale: true,
            date_cloture: true,
          },
        }),
      ]);

    const usersParApimo = new Map(utilisateurs.map((u) => [u.idapimo, u]));
    const usersParId = new Map(utilisateurs.map((u) => [u.id, u]));
    const contratsParApimo = new Map(
      contratsExistants.map((c) => [c.idcontratapimo, c])
    );
    const relationsParApimo = new Map(
      relationsExistantes.map((r) => [r.idrelationapimo, r])
    );
    const historiquesParCle = new Map(
      historiques.map((h) => [`${h.user_id}-${h.annee}`, h])
    );

    // ---------------------------------------------------------------------
    // 2. Contrats : n'écrire que ce qui est nouveau ou a réellement changé.
    // ---------------------------------------------------------------------
    type CibleContrat = {
      statut: string;
      property_id: number;
      honoraires: number;
      date_signature: Date;
    };
    const contratsACreer: { idApimo: number; cible: CibleContrat }[] = [];
    const contratsAMaj: { idApimo: number; cible: CibleContrat }[] = [];

    for (const contrat of eligibles) {
      const idApimo = Number(contrat.id);
      const cible: CibleContrat = {
        statut: contrat.step,
        property_id: Number(contrat.property),
        honoraires: Number(contrat.commission_agency),
        date_signature: new Date(contrat.contract_at as string),
      };

      const existant = contratsParApimo.get(idApimo);
      if (!existant) {
        contratsACreer.push({ idApimo, cible });
      } else if (
        existant.statut !== cible.statut ||
        existant.property_id !== cible.property_id ||
        !memeMontant(existant.honoraires, cible.honoraires) ||
        !memeJour(existant.date_signature, contrat.contract_at as string)
      ) {
        contratsAMaj.push({ idApimo, cible });
      }
    }

    // idcontratapimo → id interne, pour rattacher relations et contacts
    const idInterneParApimo = new Map(
      contratsExistants.map((c) => [c.idcontratapimo, c.id])
    );

    await runChunked(contratsACreer, async ({ idApimo, cible }) => {
      const cree = await prisma.contrats.upsert({
        where: { idcontratapimo: idApimo },
        update: { ...cible, updated_at: new Date() },
        create: { idcontratapimo: idApimo, ...cible },
      });
      idInterneParApimo.set(idApimo, cree.id);
    });

    await runChunked(contratsAMaj, async ({ idApimo, cible }) => {
      await prisma.contrats.update({
        where: { idcontratapimo: idApimo },
        data: { ...cible, updated_at: new Date() },
      });
    });

    // ---------------------------------------------------------------------
    // 3. Relations (entries) + accumulation du CA.
    // ---------------------------------------------------------------------
    type CibleRelation = { honoraires_agent: number; vat: number; vat_rate: number };
    const relationsACreer: {
      idApimo: number;
      contratId: number;
      userId: number;
      cible: CibleRelation;
    }[] = [];
    const relationsAMaj: { idApimo: number; cible: CibleRelation }[] = [];

    // Accumulateur du CA par (utilisateur, année) : on recompose le CA comme la
    // SOMME des honoraires_agent des relations type 9 vues dans ce run, puis on
    // fixe (SET) historique_ca_annuel. Recalcul idempotent (cf. recomputeCAForYear).
    const caAccumulator = new Map<
      string,
      { userId: number; year: number; total: number; label: string }
    >();

    for (const contrat of eligibles) {
      const idApimo = Number(contrat.id);
      const contratId = idInterneParApimo.get(idApimo);
      if (!contratId) continue; // création en échec : on ne rattache rien

      const contractYear = new Date(contrat.contract_at as string).getFullYear();

      // Trier les entries pour avoir les type 2, donc apporteur d'affaire, en premier
      const sortEntries = [...(contrat.entries ?? [])].sort(
        (a: Entries, b: Entries) =>
          Number(b.type === "2") - Number(a.type === "2") ||
          Number(a.type === "9") - Number(b.type === "9")
      );

      for (const entry of sortEntries) {
        const { id, user, amount, vat, vat_rate, type } = entry;

        // Seuls id, user et amount sont réellement obligatoires.
        // vat / vat_rate = 0 (conseillers non assujettis à la TVA) sont valides :
        // on ne doit donc PAS les rejeter, sinon la relation n'est jamais créée
        // ni comptée dans le CA.
        if (!id || !user || amount === undefined || amount === null) {
          continue;
        }

        const utilisateur = usersParApimo.get(Number(user));
        if (!utilisateur) {
          continue;
        }

        const idRelation = Number(id);
        const cible: CibleRelation = {
          honoraires_agent: Number(amount),
          vat: Number(vat ?? 0),
          vat_rate: Number(vat_rate ?? 0),
        };

        const existante = relationsParApimo.get(idRelation);
        if (!existante) {
          relationsACreer.push({
            idApimo: idRelation,
            contratId,
            userId: utilisateur.id,
            cible,
          });
        } else if (
          !memeMontant(existante.honoraires_agent, cible.honoraires_agent) ||
          !memeMontant(existante.vat, cible.vat) ||
          !memeMontant(existante.vat_rate, cible.vat_rate)
        ) {
          relationsAMaj.push({ idApimo: idRelation, cible });
        }

        // CA uniquement pour les conseillers (type 9) : on accumule la somme
        // des honoraires_agent par (utilisateur, année du contrat). Le CA sera
        // recomposé (SET) après la boucle — recalcul idempotent qui rattrape
        // automatiquement les montants révisés et les relations manquantes.
        if (type === "9") {
          const key = `${utilisateur.id}-${contractYear}`;
          const acc = caAccumulator.get(key) ?? {
            userId: utilisateur.id,
            year: contractYear,
            total: 0,
            label: `${utilisateur.prenom} ${utilisateur.nom}`,
          };
          acc.total += Number(amount);
          caAccumulator.set(key, acc);
        }
      }
    }

    await runChunked(
      relationsACreer,
      async ({ idApimo, contratId, userId, cible }) => {
        await prisma.relations_contrats.upsert({
          where: { idrelationapimo: idApimo },
          update: { ...cible, updated_at: new Date() },
          create: {
            idrelationapimo: idApimo,
            contrat_id: contratId,
            user_id: userId,
            ...cible,
          },
        });
      }
    );

    await runChunked(relationsAMaj, async ({ idApimo, cible }) => {
      await prisma.relations_contrats.update({
        where: { idrelationapimo: idApimo },
        data: { ...cible, updated_at: new Date() },
      });
    });

    // ---------------------------------------------------------------------
    // 4. Contacts du contrat (création uniquement, jamais de mise à jour).
    // ---------------------------------------------------------------------
    const contratIdsInternes = [...idInterneParApimo.values()];
    const contactsExistants = await prisma.contacts_contrats.findMany({
      where: { contrat_id: { in: contratIdsInternes } },
      select: { contrat_id: true, contact_id: true },
    });
    const clesContactsExistants = new Set(
      contactsExistants.map((c) => `${c.contrat_id}-${c.contact_id}`)
    );

    const contactsACreer: {
      contratId: number;
      contactId: number;
      type: number;
    }[] = [];

    for (const contrat of eligibles) {
      const contratId = idInterneParApimo.get(Number(contrat.id));
      if (!contratId) continue;

      for (const contact of contrat.contacts ?? []) {
        const { contact: contactId, type } = contact;

        // Ne pas insérer les contacts avec le type 3 ou 4
        if (!contactId || !type || type === "3" || type === "4") {
          continue;
        }

        const cle = `${contratId}-${Number(contactId)}`;
        if (clesContactsExistants.has(cle)) continue;
        clesContactsExistants.add(cle); // évite les doublons intra-run

        contactsACreer.push({
          contratId,
          contactId: Number(contactId),
          type: Number(type),
        });
      }
    }

    await runChunked(contactsACreer, async ({ contratId, contactId, type }) => {
      await prisma.contacts_contrats.upsert({
        where: {
          contrat_id_contact_id: { contrat_id: contratId, contact_id: contactId },
        },
        update: {},
        create: { contrat_id: contratId, contact_id: contactId, type },
      });
    });

    // ---------------------------------------------------------------------
    // 5. Recomposition du CA (SET) — uniquement là où la valeur cible diffère
    //    de ce qui est déjà stocké (historique + cache utilisateurs).
    // ---------------------------------------------------------------------
    const caARecalculer = [...caAccumulator.values()].filter((acc) => {
      const histo = historiquesParCle.get(`${acc.userId}-${acc.year}`);
      if (histo?.date_cloture) return false; // année clôturée : jamais réécrite

      const total = round2(acc.total);
      const utilisateur = usersParId.get(acc.userId);
      if (!utilisateur) return false;

      const retro = calculRetrocession(
        utilisateur.typecontrat || "",
        total,
        utilisateur.auto_parrain || undefined
      );

      const historiqueAJour =
        histo !== undefined &&
        memeMontant(histo.chiffre_affaires, total) &&
        memeMontant(histo.retrocession_finale, retro);

      // Le cache `utilisateurs` n'est synchronisé que pour l'année en cours
      const cacheAJour =
        acc.year !== currentYear ||
        (memeMontant(utilisateur.chiffre_affaires, total) &&
          memeMontant(utilisateur.retrocession, retro));

      return !(historiqueAJour && cacheAJour);
    });

    await runChunked(caARecalculer, async ({ userId, year, total, label }) => {
      const result = await recomputeCAForYear(userId, year, total);
      if (result) {
        console.log(
          `✅ CA recalculé pour ${label} (${year}): ${result.newCA}€ - Rétro: ${result.newRetrocession}%`
        );
      } else {
        console.log(`⏭️ CA non recalculé pour ${label} (${year}): année clôturée`);
      }
    });

    const resume = {
      contrats_crees: contratsACreer.length,
      contrats_maj: contratsAMaj.length,
      relations_creees: relationsACreer.length,
      relations_maj: relationsAMaj.length,
      contacts_crees: contactsACreer.length,
      ca_recalcules: caARecalculer.length,
      duree_ms: Date.now() - debut,
    };
    console.log("✅ Sync contrats terminée", resume);

    return NextResponse.json({
      success: true,
      message: `Sync terminée : ${resume.contrats_crees} contrat(s) créé(s), ${resume.contrats_maj} mis à jour, ${resume.relations_creees} relation(s) créée(s)`,
      ...resume,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des contrats :", error);
    if (error instanceof ApimoError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
