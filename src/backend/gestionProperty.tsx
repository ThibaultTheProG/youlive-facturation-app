"use server";

import prisma from "../lib/db";
import { Property } from "@/lib/types";

export default async function insertProperties(properties: Property[]) {
  if (!Array.isArray(properties)) {
    throw new Error("Les données de propriétés ne sont pas valides.");
  }

  try {
    for (const property of properties) {
      const { id, address, reference, city } = property;

      // ✅ Conversion des valeurs
      const idNumber = Number(id);
      const ville = city?.name ?? "";
      const cp = city?.zipcode ?? "";
      const referenceString = String(reference); // Conversion en chaîne de caractères

      // ✅ Concaténer l'adresse complète
      const fullAddress = `${address}, ${cp} ${ville}`.trim();

      // ✅ Vérification de l'existence du contrat
      const contrat = await prisma.contrats.findFirst({
        where: {
          property_id: idNumber
        },
        select: {
          id: true
        }
      });

      if (contrat) {
        // ✅ Insertion ou mise à jour de la propriété avec l'adresse complète
        await prisma.property.upsert({
          where: {
            contrat_id: contrat.id
          },
          update: {
            adresse: fullAddress,
            numero_mandat: referenceString
          },
          create: {
            adresse: fullAddress,
            numero_mandat: referenceString,
            contrat_id: contrat.id
          }
        });
      }
    }
    console.log("✅ Propriétés insérées ou mises à jour avec succès");
  } catch (error) {
    console.error("❌ Erreur lors de l'insertion des propriétés :", error);
    throw error;
  }
}
