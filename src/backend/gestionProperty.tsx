import db from "../lib/db.js";
import { Property } from "@/lib/types";

export default async function insertProperties(properties: Property[]) {
  const client = await db.connect();

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

      // ✅ Concaténer l'adresse complète
      const fullAddress = `${address}, ${cp} ${ville}`.trim();

      // ✅ Vérification de l'existence du contrat
      const checkQuery = `SELECT id FROM contrats WHERE property_id = $1 LIMIT 1;`;
      const checkResult = await client.query(checkQuery, [idNumber]);

      if (checkResult.rows.length > 0) {
        const idContrat = checkResult.rows[0].id; // ID du contrat

        // ✅ Insertion ou mise à jour de la propriété avec l'adresse complète
        const query = `
          INSERT INTO property (adresse, numero_mandat, contrat_id) 
          VALUES ($1, $2, $3)
          ON CONFLICT (contrat_id) 
          DO UPDATE SET 
            adresse = EXCLUDED.adresse,
            numero_mandat = EXCLUDED.numero_mandat;
        `;

        await client.query(query, [fullAddress, reference, idContrat]);
      }
    }
    console.log("✅ Propriétés insérées ou mises à jour avec succès");
  } catch (error) {
    console.error("❌ Erreur lors de l'insertion des propriétés :", error);
  } finally {
    client.release();
  }
}
