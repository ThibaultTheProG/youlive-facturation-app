"use server";

import db from "../lib/db.js";
import { Conseiller } from "@/lib/types";

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

export async function getConseillersBDD(): Promise<Conseiller[]> {
  const client = await db.connect();

  try {
    const result = await client.query("SELECT * FROM utilisateurs");
    return result.rows as Conseiller[]; // Conversion explicite en type Conseiller
  } catch (error) {
    console.error(
      "Impossible de récupérer les conseillers depuis la BDD",
      error
    );
    return []; // Retourner un tableau vide en cas d'erreur
  } finally {
    client.release();
  }
}

export async function getParrainnageBDD(selectConseillerId?: number) {
  const client = await db.connect();

  try {
    // Requête pour récupérer le parrain de niveau 1 pour le conseiller sélectionné
    const query = `
      SELECT p.parrain_id, u.prenom, u.nom, u.email
      FROM parrainages p
      INNER JOIN utilisateurs u ON p.parrain_id = u.idapimo
      WHERE p.filleul_id = $1;
    `;
    const result = await client.query(query, [selectConseillerId]);

    // Retourner le parrain si trouvé, sinon null
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error("Erreur lors de la récupération du parrainnage :", error);
    throw error;
  } finally {
    client.release();
  }
}

export async function getParrains(filleulIdApimo: number) {
  const client = await db.connect();

  try {
    const query = `
      WITH RECURSIVE ParrainageCTE AS (
        -- Point de départ : le conseiller sélectionné
        SELECT 
          p.niveau, 
          u.prenom, 
          u.nom, 
          u.idapimo AS parrain_id,
          p.filleul_id
        FROM parrainages p
        JOIN utilisateurs u ON p.parrain_id = u.idapimo
        WHERE p.filleul_id = $1

        UNION ALL

        -- Rejoindre la table parrainages pour chercher les parrains des parrains
        SELECT 
          p.niveau + ParrainageCTE.niveau AS niveau,
          u.prenom,
          u.nom,
          u.idapimo AS parrain_id,
          p.filleul_id
        FROM parrainages p
        JOIN utilisateurs u ON p.parrain_id = u.idapimo
        JOIN ParrainageCTE ON ParrainageCTE.parrain_id = p.filleul_id
      )
      SELECT DISTINCT niveau, prenom, nom, parrain_id
      FROM ParrainageCTE
      ORDER BY niveau;
    `;
    const result = await client.query(query, [filleulIdApimo]);

    return result.rows; // Contient tous les parrains avec leurs niveaux
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des parrains pour le conseiller :",
      error
    );
    return [];
  } finally {
    client.release();
  }
}

export async function upsertParrainnageBDD(
  conseillerIdApimo: number,
  parrainIdApimo: number,
  niveau: number
) {
  const client = await db.connect();

  try {
    // Vérification pour empêcher un conseiller de se parrainer lui-même
    if (conseillerIdApimo === parrainIdApimo) {
      throw new Error(
        `Un conseiller ne peut pas être défini comme son propre parrain.`
      );
    }

    // Vérifier que le parrain existe dans la table utilisateurs
    const checkParrainQuery = `
      SELECT idapimo FROM utilisateurs WHERE idapimo = $1;
    `;
    const parrainExists = await client.query(checkParrainQuery, [
      parrainIdApimo,
    ]);

    if (parrainExists.rows.length === 0) {
      throw new Error(
        `Le parrain avec l'idApimo ${parrainIdApimo} n'existe pas dans la table utilisateurs.`
      );
    }

    // Vérifier si un lien de parrainage existe déjà
    const checkQuery = `
      SELECT * FROM parrainages
      WHERE filleul_id = $1 AND niveau = $2;
    `;
    const result = await client.query(checkQuery, [conseillerIdApimo, niveau]);

    if (result.rows.length > 0) {
      // Si un lien existe, le mettre à jour
      const updateQuery = `
        UPDATE parrainages
        SET parrain_id = $1
        WHERE filleul_id = $2 AND niveau = $3;
      `;
      await client.query(updateQuery, [
        parrainIdApimo,
        conseillerIdApimo,
        niveau,
      ]);
      console.log(`Parrain de niveau ${niveau} mis à jour avec succès.`);
    } else {
      // Sinon, insérer un nouveau lien de parrainage
      const insertQuery = `
        INSERT INTO parrainages (filleul_id, parrain_id, niveau)
        VALUES ($1, $2, $3);
      `;
      await client.query(insertQuery, [
        conseillerIdApimo,
        parrainIdApimo,
        niveau,
      ]);
      console.log(`Parrain de niveau ${niveau} ajouté avec succès.`);
    }
  } catch (error) {
    console.error("Erreur lors de la gestion du parrainnage :", error);
  } finally {
    client.release();
  }
}

export async function updateConseillersBDD(formData: FormData) {
  const client = await db.connect();

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

  // Convertir les valeurs en types compatibles
  const tva =
    rawFormData.tva === "oui" ? true : rawFormData.tva === "non" ? false : null;
  const siren =
    rawFormData.siren && rawFormData.siren !== ""
      ? Number(rawFormData.siren)
      : null;
  const chiffreAffaires =
    rawFormData.chiffreAffaires && rawFormData.chiffreAffaires !== ""
      ? Number(rawFormData.chiffreAffaires)
      : null;
  const retrocession =
    rawFormData.retrocession && rawFormData.retrocession !== ""
      ? Number(rawFormData.retrocession)
      : null;

  const query = `
    UPDATE utilisateurs
    SET adresse = $1, siren = $2, tva = $3, typecontrat = $4, chiffre_affaires = $5, retrocession = $6
    WHERE idapimo = $7;
  `;

  try {
    await client.query(query, [
      rawFormData.localisation,
      siren,
      tva,
      rawFormData.type_contrat,
      chiffreAffaires,
      retrocession,
      rawFormData.idApimo,
    ]);
    console.log("Conseiller mis à jour avec succès.");
  } catch (error) {
    console.error(
      "Impossible de modifier les informations associés au conseiller",
      error
    );
  } finally {
    client.release();
  }
}
