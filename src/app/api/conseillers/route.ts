import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { ApimoError, fetchApimoAll } from "@/utils/apimo";
import { memeTexte, runChunked } from "@/utils/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

type ConseillerInput = {
  id: number;
  firstname: string;
  lastname: string;
  email?: string;
  phone?: string;
  mobile?: string;
  city?: { name: string };
  partners?: Array<{ reference: string }>;
};

export async function GET() {
  const debut = Date.now();
  try {
    const conseillers = await fetchApimoAll<ConseillerInput>("users", "users");

    if (!Array.isArray(conseillers)) {
      throw new Error("Les données conseillers ne sont pas valides.");
    }

    // ---------------------------------------------------------------------
    // Préchargement : 2 SELECT au lieu de 2 requêtes par conseiller.
    // ---------------------------------------------------------------------
    const [existants, parrainages] = await Promise.all([
      prisma.utilisateurs.findMany({
        select: {
          id: true,
          idapimo: true,
          prenom: true,
          nom: true,
          email: true,
          telephone: true,
          mobile: true,
          siren: true,
        },
      }),
      prisma.parrainages.findMany({ select: { user_id: true } }),
    ]);
    const existantParApimo = new Map(existants.map((u) => [u.idapimo, u]));
    const avecParrainage = new Set(parrainages.map((p) => p.user_id));

    // ---------------------------------------------------------------------
    // Diff en mémoire.
    // ---------------------------------------------------------------------
    type Cible = {
      idapimo: number;
      prenom: string;
      nom: string;
      email: string | null;
      telephone: string | null;
      mobile: string | null;
      siren: string | null;
      adresse: string | null;
    };
    const aCreer: Cible[] = [];
    const aMaj: Cible[] = [];
    let ignores = 0;

    for (const conseiller of conseillers) {
      const { id, firstname, lastname, email, phone, mobile, city, partners } =
        conseiller;

      if (!firstname || !lastname) {
        ignores++;
        continue;
      }

      const cible: Cible = {
        idapimo: Number(id),
        prenom: firstname,
        nom: lastname,
        email: email || null,
        telephone: phone || null,
        mobile: mobile || null,
        siren: partners?.[0]?.reference || null,
        // `adresse` n'est renseignée qu'à la création : elle est ensuite
        // modifiable dans l'app et ne doit pas être écrasée par Apimo.
        adresse: city?.name || null,
      };

      const existant = existantParApimo.get(cible.idapimo);
      if (!existant) {
        aCreer.push(cible);
      } else if (
        !memeTexte(existant.prenom, cible.prenom) ||
        !memeTexte(existant.nom, cible.nom) ||
        !memeTexte(existant.email, cible.email) ||
        !memeTexte(existant.telephone, cible.telephone) ||
        !memeTexte(existant.mobile, cible.mobile) ||
        !memeTexte(existant.siren, cible.siren)
      ) {
        aMaj.push(cible);
      }
    }

    let erreurs = 0;
    const idsSansParrainage: number[] = [];

    await runChunked(aCreer, async (cible) => {
      try {
        const cree = await prisma.utilisateurs.create({
          data: { ...cible, role: "conseiller" },
        });
        idsSansParrainage.push(cree.id);
      } catch (error) {
        erreurs++;
        console.error(`❌ Conseiller ${cible.idapimo} non créé :`, error);
      }
    });

    await runChunked(aMaj, async (cible) => {
      const { idapimo, prenom, nom, email, telephone, mobile, siren } = cible;
      try {
        await prisma.utilisateurs.update({
          where: { idapimo },
          // `adresse` volontairement absente : cf. commentaire plus haut
          data: {
            prenom,
            nom,
            email,
            telephone,
            mobile,
            siren,
            updated_at: new Date(),
          },
        });
      } catch (error) {
        erreurs++;
        console.error(`❌ Conseiller ${idapimo} non mis à jour :`, error);
      }
    });

    // Parrainage vide pour les conseillers Apimo qui n'en ont pas encore.
    // Volontairement limité aux utilisateurs remontés par Apimo : les comptes
    // créés depuis l'app ont leur propre parcours d'inscription.
    const idsApimoVus = new Set(
      conseillers
        .filter((c) => c.firstname && c.lastname)
        .map((c) => Number(c.id))
    );
    for (const utilisateur of existants) {
      if (
        idsApimoVus.has(utilisateur.idapimo) &&
        !avecParrainage.has(utilisateur.id)
      ) {
        idsSansParrainage.push(utilisateur.id);
      }
    }

    let parrainagesCrees = 0;
    if (idsSansParrainage.length > 0) {
      const resultat = await prisma.parrainages.createMany({
        data: idsSansParrainage.map((user_id) => ({
          user_id,
          niveau1: null,
          niveau2: null,
          niveau3: null,
        })),
        skipDuplicates: true,
      });
      parrainagesCrees = resultat.count;
    }

    const resume = {
      conseillers_apimo: conseillers.length,
      crees: aCreer.length,
      mis_a_jour: aMaj.length,
      ignores_sans_nom: ignores,
      parrainages_crees: parrainagesCrees,
      erreurs,
      duree_ms: Date.now() - debut,
    };
    console.log("✅ Sync conseillers terminée", resume);

    return NextResponse.json({ success: true, ...resume });
  } catch (error) {
    console.error("Erreur lors de la synchronisation des conseillers :", error);
    if (error instanceof ApimoError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: "Erreur lors de la synchronisation des conseillers" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const data = await req.json();
    const { id, parrain_id, niveau2_id, niveau3_id, ...conseillerData } = data;

    // Ajout de logs pour déboguer
    console.log("Données reçues:", {
      id,
      parrain_id,
      niveau2_id,
      niveau3_id,
      ...conseillerData,
    });

    if (!id) {
      return NextResponse.json(
        { error: "ID du conseiller manquant" },
        { status: 400 }
      );
    }

    // Mise à jour des informations du conseiller
    try {
      await prisma.utilisateurs.update({
        where: { id: Number(id) },
        data: conseillerData,
      });
      console.log("Mise à jour utilisateur réussie");
    } catch (updateError) {
      console.error(
        "Erreur lors de la mise à jour de l'utilisateur:",
        updateError
      );
      return NextResponse.json(
        {
          error: `Erreur lors de la mise à jour de l'utilisateur: ${
            updateError instanceof Error
              ? updateError.message
              : String(updateError)
          }`,
        },
        { status: 500 }
      );
    }

    // Gestion des parrainages
    try {
      const existingParrainage = await prisma.parrainages.findFirst({
        where: { user_id: Number(id) },
      });
      console.log("Parrainage existant:", existingParrainage);

      // Préparation des données de parrainage avec vérification des valeurs
      const parrainageData = {
        niveau1: parrain_id ? Number(parrain_id) : null,
        niveau2: niveau2_id ? Number(niveau2_id) : null,
        niveau3: niveau3_id ? Number(niveau3_id) : null,
      };

      console.log("Données de parrainage à enregistrer:", parrainageData);

      // Mise à jour ou création du parrainage
      if (existingParrainage) {
        await prisma.parrainages.update({
          where: { id: existingParrainage.id },
          data: parrainageData,
        });
        console.log("Mise à jour parrainage réussie");
      } else if (parrain_id || niveau2_id || niveau3_id) {
        await prisma.parrainages.create({
          data: {
            user_id: Number(id),
            ...parrainageData,
          },
        });
        console.log("Création parrainage réussie");
      }
    } catch (parrainageError) {
      console.error(
        "Erreur lors de la gestion des parrainages:",
        parrainageError
      );
      return NextResponse.json(
        {
          error: `Erreur lors de la gestion des parrainages: ${
            parrainageError instanceof Error
              ? parrainageError.message
              : String(parrainageError)
          }`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Conseiller mis à jour avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du conseiller:", error);
    return NextResponse.json(
      {
        error: `Erreur lors de la mise à jour du conseiller: ${
          error instanceof Error ? error.message : String(error)
        }`,
      },
      { status: 500 }
    );
  }
}
