import db from "../lib/db.js";

export default async function insertProperties(properties: object) {
  const client = await db.connect();

  if (!Array.isArray(properties)) {
    throw new Error("Les données conseillers ne sont pas valides.");
  }

  try {
    for (const property of properties) {
      const { id, address } = property;

      // Conversion des valeurs en nombres
      const idNumber = Number(id);

      const query = `INSERT INTO property (property_id_apimo,address) VALUES ($1, $2) ON CONFLICT (property_id_apimo) DO NOTHING RETURNING *;`;

      await client.query(query, [idNumber, address]);
    }
    console.log("Propriétés insérés avec succès");
  } catch (error) {
    console.error("Erreur lors de l'insertion des propriétés", error);
  } finally {
    client.release();
  }
}
