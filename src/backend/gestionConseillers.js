import db from "../lib/db.js";

export async function insertConseillers(conseillers) {
  if (!Array.isArray(conseillers)) {
    throw new Error("Les données conseillers ne sont pas valides.");
  }

  const client = await db.connect();

  try {
    for (const conseiller of conseillers) {
      const { id, firstname, lastname, email, phone, city } = conseiller;
      const adresse = city?.name || null;
      const createdAt = new Date();

      if (!firstname || !lastname) {
        continue; // Ignorer cet enregistrement
      }
      const query = `
    INSERT INTO utilisateurs (idApimo, prenom, nom, email, telephone, adresse, role, created_at) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (idApimo) DO NOTHING 
    RETURNING *;
  `;  

      await client.query(query, [
        id,
        firstname || null,
        lastname || null,
        email || null,
        phone || null,
        adresse,
        "conseiller",
        createdAt,
      ]);
    }

    console.log("Conseillers insérés avec succès");
  } catch (error) {
    console.error("Erreur lors de l'insertion des conseillers", error);
  } finally {
    client.release();
  }
}


export async function getConseillersBDD() {

  const client = await db.connect();

  try {
    const conseillers = await client.query('SELECT * FROM utilisateurs');
    return conseillers.rows;
  } catch (error) {
    console.error("Impossible de récupérer les conseillers depuis la BDD", error);
  } finally {
    client.release();
  }
  
}