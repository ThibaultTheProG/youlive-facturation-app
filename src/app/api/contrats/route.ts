import prisma from "@/lib/db";
import { Contract, Entries } from "@/lib/types";
import { NextResponse } from "next/server";
import { checkAndResetYearIfNeeded } from "@/utils/resetCAYear";
import { recomputeCAForYear } from "@/utils/historiqueCA";

export async function GET() {
  try {
    // Vérifier si une réinitialisation annuelle est nécessaire
    await checkAndResetYearIfNeeded();

    // Appel à l'API Apimo
    const response = await fetch(
      "https://api.apimo.pro/agencies/24045/contracts",
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${process.env.USERNAME}:${process.env.PASSWORD}`
          ).toString("base64")}`,
          cache: "force-cache",
        },
      }
    );

    // Vérification de la réponse
    if (!response.ok) {
      return NextResponse.json(
        { error: "Échec de la récupération des contrats" },
        { status: response.status }
      );
    }

    // Extraction et filtrage des contrats
    const brut = await response.json();
    const contracts: Contract[] = brut.contracts || [];
    const filteredContracts = contracts.filter(
      (contract) => contract.step === "4"
    );

    console.log("Nombre de contrats filtrés:", filteredContracts.length);

    // Insérer les contrats directement avec Prisma
    const currentYear = new Date().getFullYear();
    const insertedContracts = [];

    // Accumulateur du CA par (utilisateur, année) : on recompose le CA comme la
    // SOMME des honoraires_agent des relations type 9 vues dans ce run, puis on
    // fixe (SET) historique_ca_annuel. Recalcul idempotent (cf. recomputeCAForYear).
    const caAccumulator = new Map<
      string,
      { userId: number; year: number; total: number; label: string }
    >();

    for (const contrat of filteredContracts) {
      const { id, step, property, commission_agency, contract_at, entries } =
        contrat;

      // Validation des champs principaux
      if (!id || !step || !property || !commission_agency || !contract_at) {
        console.log(
          "Contrat invalide, certains champs requis sont manquants :",
          contrat
        );
        continue;
      }

      // Accepter les contrats de l'année en cours et de l'année précédente
      const contractYear = new Date(contract_at).getFullYear();
      if (contractYear < currentYear - 1) {
        continue;
      }

      try {
        // Insérer ou mettre à jour le contrat
        const createdContrat = await prisma.contrats.upsert({
          where: {
            idcontratapimo: Number(id),
          },
          update: {
            statut: step,
            property_id: Number(property),
            honoraires: Number(commission_agency),
            date_signature: new Date(contract_at),
          },
          create: {
            idcontratapimo: Number(id),
            statut: step,
            property_id: Number(property),
            honoraires: Number(commission_agency),
            date_signature: new Date(contract_at),
          },
        });

        insertedContracts.push(createdContrat);

        // Trier les entries pour avoir les type 2, donc apporteur d'affaire, en premier
        const sortEntries = entries?.sort(
          (a: Entries, b: Entries) =>
            Number(b.type === "2") - Number(a.type === "2") ||
            Number(a.type === "9") - Number(b.type === "9")
        );

        // Gérer les relations (entries)
        if (sortEntries && Array.isArray(sortEntries)) {
          for (const entry of sortEntries) {
            const { id, user, amount, vat, vat_rate, type } = entry;

            // Seuls id, user et amount sont réellement obligatoires.
            // vat / vat_rate = 0 (conseillers non assujettis à la TVA) sont valides :
            // on ne doit donc PAS les rejeter, sinon la relation n'est jamais créée
            // ni comptée dans le CA.
            if (!id || !user || amount === undefined || amount === null) {
              continue;
            }

            // Trouver l'utilisateur correspondant
            const utilisateur = await prisma.utilisateurs.findFirst({
              where: { idapimo: Number(user) },
              select: {
                id: true,
                prenom: true,
                nom: true,
                chiffre_affaires: true,
                typecontrat: true,
                auto_parrain: true,
              },
            });

            if (!utilisateur) {
              continue;
            }

            // Créer la relation si elle n'existe pas
            const relationResult = await prisma.relations_contrats.upsert({
              where: {
                idrelationapimo: Number(id),
              },
              update: {
                honoraires_agent: Number(amount),
                vat: Number(vat ?? 0),
                vat_rate: Number(vat_rate ?? 0),
              },
              create: {
                idrelationapimo: Number(id),
                contrat_id: createdContrat.id,
                user_id: utilisateur.id,
                honoraires_agent: Number(amount),
                vat: Number(vat ?? 0),
                vat_rate: Number(vat_rate ?? 0),
              },
            });

            // CA uniquement pour les conseillers (type 9) : on accumule la somme
            // des honoraires_agent par (utilisateur, année du contrat). Le CA sera
            // recomposé (SET) après la boucle — recalcul idempotent qui rattrape
            // automatiquement les montants révisés et les relations manquantes.
            if (type === "9" && relationResult) {
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

        // Gérer les contacts (si disponibles dans l'API)
        // @ts-expect-error - La propriété contacts n'est pas définie dans le type Contract
        if (contrat.contacts && Array.isArray(contrat.contacts)) {
          // @ts-expect-error - La propriété contacts n'est pas définie dans le type Contract
          for (const contact of contrat.contacts) {
            const { contact: contactId, type } = contact;

            // Ne pas insérer les contacts avec le type 3 ou 4
            if (!contactId || !type || type === "3" || type === "4") {
              continue;
            }

            await prisma.contacts_contrats.upsert({
              where: {
                contrat_id_contact_id: {
                  contrat_id: createdContrat.id,
                  contact_id: Number(contactId),
                },
              },
              update: {},
              create: {
                contrat_id: createdContrat.id,
                contact_id: Number(contactId),
                type: Number(type),
              },
            });
          }
        }
      } catch (error) {
        console.error("Erreur lors du traitement du contrat:", error);
      }
    }

    console.log(`${insertedContracts.length} contrats insérés avec succès`);

    // Recomposer le CA (SET) pour chaque (utilisateur, année) touché dans ce run.
    // Idempotent : rejoue la somme complète sans jamais double-compter.
    for (const { userId, year, total, label } of caAccumulator.values()) {
      const result = await recomputeCAForYear(userId, year, total);
      if (result) {
        console.log(
          `✅ CA recalculé pour ${label} (${year}): ${result.newCA}€ - Rétro: ${result.newRetrocession}%`
        );
      } else {
        console.log(`⏭️ CA non recalculé pour ${label} (${year}): année clôturée`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `${insertedContracts.length} contrats insérés avec succès`,
      data: filteredContracts,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des contrats :", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
