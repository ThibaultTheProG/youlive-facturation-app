import db from "../lib/db.js";

export default async function insertContrats(contrats: object) {
  const client = await db.connect();

  if (!Array.isArray(contrats)) {
    throw new Error("Les données conseillers ne sont pas valides.");
  }

  try {
    for (const contrat of contrats) {
      const { id, step, property, price, price_net, commission, updated_at } =
        contrat;

      // Conversion des valeurs en nombres
      const idNumber = Number(id);
      const stepNumber = Number(step);
      const propertyNumber = Number(property);
      const priceNumber = Number(price);
      const priceNetNumber = Number(price_net);
      const commissionNumber = Number(commission);
      const upadatedAtDate = new Date(updated_at);

      const query = `INSERT INTO contrats (idcontratapimo,statut,property_id,price,price_net,honoraires,date_signature,numero_mandat) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (idcontratapimo) DO NOTHING RETURNING *;`;

      await client.query(query, [
        idNumber,
        stepNumber,
        propertyNumber,
        priceNumber,
        priceNetNumber,
        commissionNumber,
        upadatedAtDate,
        999,
      ]);
    }
    console.log("Contrats insérés avec succès");
  } catch (error) {
    console.error("Erreur lors de l'insertion des contrats", error);
  } finally {
    client.release();
  }
}
