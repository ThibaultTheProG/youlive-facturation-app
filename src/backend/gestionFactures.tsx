import db from "../lib/db.js";

export default async function createFactures() {
  const client = await db.connect();

  try {
    console.log("Début de la génération des factures...");
    // Étape 1 : Récupérer les contrats sans facture associée
    const contractsQuery = `
        SELECT c.id AS contrat_id, c.date_signature, c.honoraires,
               p.property_id_apimo, p.adress AS property_address, p.numero_mandat,
               u.idapimo AS user_id_apimo, u.retrocession
        FROM contrats c
        LEFT JOIN factures f ON c.id = f.contrat_id
        INNER JOIN property p ON c.property_id = p.property_id_apimo
        INNER JOIN utilisateurs u ON u.idapimo = c.user_id
        WHERE f.id IS NULL;
      `;
    const contractsResult = await client.query(contractsQuery);
    const contracts = contractsResult.rows;

    console.log(`${contracts.length} contrats sans facture détectés.`);

    for (const contract of contracts) {
      const {
        contrat_id,
        user_id_apimo,
        numero_mandat,
        date_signature,
        honoraires,
        retrocession,
        property_address,
      } = contract;

      console.log(`Traitement pour le user_id_apimo ${user_id_apimo} : `, {
        numero_mandat,
        date_signature,
        honoraires,
      });

      // Insérer les factures
      const insertFactureQuery = `
          INSERT INTO factures (contrat_id, user_id, type, honoraire, retrocession, numeroMandat, dateSignature, statut_dispo, statut_paiement, url_fichier)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING *;
        `;

      await client.query(insertFactureQuery, [
        contrat_id,
        user_id_apimo,
        "standard", // Exemple de type de facture
        honoraires,
        retrocession,
        numero_mandat,
        date_signature,
        "disponible", // Exemple de statut
        "non payé", // Exemple de statut paiement
        null, // URL fichier vide par défaut
      ]);

      console.log(`Facture insérée pour le contrat ${contrat_id}.`);
    }
  } catch (error) {
    console.error("Erreur lors de la création des factures :", error);
  } finally {
    client.release();
  }
}
