import prisma from "@/lib/db";
import { Property } from "@/lib/types";
import { NextResponse } from "next/server";
import { ApimoError, fetchApimoAll } from "@/utils/apimo";
import { memeTexte, runChunked } from "@/utils/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET() {
  const debut = Date.now();
  try {
    // Les deux statuts sont récupérés en parallèle, pagination déroulée
    const [status30, status39] = await Promise.all([
      fetchApimoAll<Property>("properties?status[]=30", "properties"),
      fetchApimoAll<Property>("properties?status[]=39", "properties"),
    ]);

    // Dédoublonnage par id : une propriété présente dans les deux statuts ne doit
    // pas être écrite deux fois (la dernière occurrence l'emporte, comme avant).
    const proprietesParId = new Map<number, Property>();
    for (const propriete of [...status30, ...status39]) {
      if (propriete?.id === undefined || propriete?.id === null) continue;
      proprietesParId.set(Number(propriete.id), propriete);
    }
    const proprietes = [...proprietesParId.values()];

    console.log(
      `📊 ${status30.length + status39.length} propriétés Apimo → ${
        proprietes.length
      } uniques`
    );

    // ---------------------------------------------------------------------
    // Préchargement : 2 SELECT au lieu d'un findFirst par propriété.
    // ---------------------------------------------------------------------
    const contrats = await prisma.contrats.findMany({
      select: { id: true, property_id: true },
    });
    // Un même property_id peut théoriquement porter plusieurs contrats :
    // on conserve le premier trouvé, comme le faisait `findFirst`.
    const contratParPropertyId = new Map<number, number>();
    for (const contrat of contrats) {
      if (!contratParPropertyId.has(contrat.property_id)) {
        contratParPropertyId.set(contrat.property_id, contrat.id);
      }
    }

    const propertiesExistantes = await prisma.property.findMany({
      select: { contrat_id: true, adresse: true, numero_mandat: true },
    });
    const propertyParContratId = new Map(
      propertiesExistantes.map((p) => [p.contrat_id, p])
    );

    // ---------------------------------------------------------------------
    // Diff en mémoire : n'écrire que ce qui est nouveau ou a changé.
    // ---------------------------------------------------------------------
    type Cible = {
      contratId: number;
      adresse: string;
      numeroMandat: string;
    };
    const aCreer: Cible[] = [];
    const aMaj: Cible[] = [];
    let sansContrat = 0;

    for (const propriete of proprietes) {
      const { id, address, reference, city } = propriete;

      const contratId = contratParPropertyId.get(Number(id));
      if (!contratId) {
        sansContrat++;
        continue;
      }

      const ville = city?.name ?? "";
      const cp = city?.zipcode ?? "";
      const cible: Cible = {
        contratId,
        adresse: `${address}, ${cp} ${ville}`.trim(),
        numeroMandat: String(reference),
      };

      const existante = propertyParContratId.get(contratId);
      if (!existante) {
        aCreer.push(cible);
      } else if (
        !memeTexte(existante.adresse, cible.adresse) ||
        // `numero_mandat` est un CHAR(200) : complété par des espaces à la
        // lecture, d'où la comparaison sur la valeur trimée.
        !memeTexte(existante.numero_mandat, cible.numeroMandat)
      ) {
        aMaj.push(cible);
      }
    }

    // Une adresse trop longue (colonne VARCHAR(120)) ne doit pas faire échouer
    // toute la synchronisation : on isole l'erreur par propriété.
    let erreurs = 0;
    const ecrire = async ({ contratId, adresse, numeroMandat }: Cible) => {
      try {
        await prisma.property.upsert({
          where: { contrat_id: contratId },
          update: {
            adresse,
            numero_mandat: numeroMandat,
            update_at: new Date(),
          },
          create: {
            adresse,
            numero_mandat: numeroMandat,
            contrat_id: contratId,
          },
        });
      } catch (error) {
        erreurs++;
        console.error(
          `❌ Propriété non enregistrée (contrat ${contratId}) :`,
          error
        );
      }
    };

    await runChunked(aCreer, ecrire);
    await runChunked(aMaj, ecrire);

    const resume = {
      proprietes_apimo: proprietes.length,
      creees: aCreer.length,
      mises_a_jour: aMaj.length,
      sans_contrat_associe: sansContrat,
      erreurs,
      duree_ms: Date.now() - debut,
    };
    console.log("✅ Sync propriétés terminée", resume);

    return NextResponse.json({ success: true, ...resume });
  } catch (error) {
    console.error("Erreur lors de la récupération des propriétés :", error);
    if (error instanceof ApimoError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
