import db from "../lib/db.js";

export default async function insertProperties(properties) {
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
        SELECT 1 
        FROM contrats 
        WHERE property_id = $1 
        LIMIT 1;
      `;
      const checkResult = await client.query(checkQuery, [idNumber]);

      console.log(`Vérification pour property_id ${idNumber} :`, checkResult.rows);

      // Si l'id existe dans contrats, insérer la propriété
      if (checkResult.rowCount > 0) {
        const query = `
          INSERT INTO property (property_id_apimo, address, numero_mandat) 
          VALUES ($1, $2, $3)
          ON CONFLICT (property_id_apimo) 
          DO UPDATE SET 
            address = EXCLUDED.address,
            numero_mandat = EXCLUDED.numero_mandat;
        `;
        await client.query(query, [idNumber, address, reference]);
      }
    }
    console.log("Propriétés insérées ou mises à jour avec succès");
  } catch (error) {
    console.error("Erreur lors de l'insertion ou de la mise à jour des propriétés :", error);
  } finally {
    client.release();
  }
}