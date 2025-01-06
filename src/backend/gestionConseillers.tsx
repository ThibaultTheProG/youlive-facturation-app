"use server";

import db from "../lib/db.js";

export async function insertConseillers(conseillers: object) {
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
    const conseillers = await client.query("SELECT * FROM utilisateurs");
    return conseillers.rows;
  } catch (error) {
    console.error(
      "Impossible de récupérer les conseillers depuis la BDD",
      error
    );
  } finally {
    client.release();
  }
}

export async function updateConseillersBDD(formData: FormData) {
  const client = await db.connect();

  console.log(formData);

  const rawFormData = {
    nom: formData.get("nom"),
    prenom: formData.get("prenom"),
    idApimo: formData.get("id_apimo"),
    email: formData.get("email"),
    telephone: formData.get("telephone"),
    localisation: formData.get("localisation"),
    siren: formData.get("siren"),
    tva: formData.get("assujetti_tva"),
    type_contrat: formData.get("type_contrat"),
    chiffreAffaires: formData.get("chiffre_affaire_annuel"),
    retrocession: formData.get("retrocession"),
  };

  let tva;

  if (rawFormData.tva === "oui"){
    tva = true;
  } else if (rawFormData.tva === "non") {
    tva = false;
  } else {
    tva = null;
  }

  const query = `UPDATE utilisateurs 
  SET adresse=$1, siren=$2, tva=$3, typecontrat=$4, chiffre_affaires=$5, retrocession=$6
  WHERE idapimo=$7;`;

  try {
    await client.query(query, [
      rawFormData.localisation,
      rawFormData.siren,
      tva,
      rawFormData.type_contrat,
      rawFormData.chiffreAffaires,
      rawFormData.retrocession,
      rawFormData.idApimo,
    ]);
  } catch (error) {
    console.error(
      "Impossible de modifier les informations associés au conseiller",
      error
    );
  } finally {
    client.release();
  }
}
