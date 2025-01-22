import db from "../lib/db.js";
import { Property } from "@/lib/types";

export default async function insertProperties(properties: Property[]) {
  const client = await db.connect();

  if (!Array.isArray(properties)) {
    throw new Error("Les données de propriétés ne sont pas valides.");
  }

  try {
    for (const property of properties) {
      const { id, address, reference } = property;

      // Conversion des valeurs en nombres
      const idNumber = Number(id);

      // Vérifier si l'id est présent dans la colonne property_id de la table contrats
      const checkQuery = `
        SELECT id 
        FROM contrats 
        WHERE property_id = $1 
        LIMIT 1;
      `;
      const checkResult = await client.query(checkQuery, [idNumber]);

      console.log(`Vérification pour property_id ${idNumber} :`, checkResult.rows);

      // Si l'id existe dans contrats, insérer la propriété
      if (checkResult.rowCount! > 0) {
        const idContrat = checkResult.rows[0].id; // Récupérer l'id du contrat

        const query = `
          INSERT INTO property (adresse, numero_mandat, contrat_id) 
          VALUES ($1, $2, $3)
          ON CONFLICT (contrat_id) 
          DO UPDATE SET 
            adresse = EXCLUDED.adresse,
            numero_mandat = EXCLUDED.numero_mandat;
        `;
        await client.query(query, [address, reference, idContrat]);
      }
    }
    console.log("Propriétés insérées ou mises à jour avec succès");
  } catch (error) {
    console.error("Erreur lors de l'insertion ou de la mise à jour des propriétés :", error);
  } finally {
    client.release();
  }
}