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

export async function updateConseillersBDD(
  formData: FormData,
  parrain_id: number | null,
  id: number
) {
  const client = await db.connect();

  const rawFormData = {
    nom: formData.get("nom"),
    prenom: formData.get("prenom"),
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
    SET 
      adresse = $1, 
      siren = $2, 
      tva = $3, 
      typecontrat = $4, 
      chiffre_affaires = $5, 
      retrocession = $6,
      parrain_id = $7
    WHERE id = $8;
  `;

  try {
    await client.query(query, [
      rawFormData.localisation,
      siren,
      tva,
      rawFormData.type_contrat,
      chiffreAffaires,
      retrocession,
      parrain_id,
      id,
    ]);
    console.log("Conseiller mis à jour avec succès.");
  } catch (error) {
    console.error(
      "Impossible de modifier les informations associées au conseiller",
      error
    );
  } finally {
    client.release();
  }
}

export async function handleParrainages(
  selectedParrain: string,
  parrainId: number
) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");
    console.log(
      `Gestion des relations pour le parrain sélectionné ${selectedParrain}`
    );

    // Fonction utilitaire pour récupérer les filleuls
    const getFilleuls = async (parrainId: number) => {
      const query = `
        SELECT id, prenom
        FROM utilisateurs
        WHERE parrain_id = $1;
      `;
      return await client.query(query, [parrainId]);
    };

    // Gérer les relations de niveau 2
    const filleulsNiveau1 = await getFilleuls(parrainId);
    for (const filleul of filleulsNiveau1.rows) {
      const filleulsNiveau2 = await getFilleuls(filleul.id);
      for (const filleulNiveau2 of filleulsNiveau2.rows) {
        await client.query(
          `
          INSERT INTO parrainages (prenom_filleul, filleul_id, prenom_parrain, parrain_id, niveau)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (filleul_id, parrain_id, niveau) DO NOTHING;
        `,
          [
            filleulNiveau2.prenom,
            filleulNiveau2.id,
            selectedParrain,
            parrainId,
            2,
          ]
        );

        // Gérer les relations de niveau 3
        const filleulsNiveau3 = await getFilleuls(filleulNiveau2.id);
        for (const filleulNiveau3 of filleulsNiveau3.rows) {
          await client.query(
            `
            INSERT INTO parrainages (prenom_filleul, filleul_id, prenom_parrain, parrain_id, niveau)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (filleul_id, parrain_id, niveau) DO NOTHING;
          `,
            [
              filleulNiveau3.prenom,
              filleulNiveau3.id,
              selectedParrain,
              parrainId,
              3,
            ]
          );
        }
      }
    }
    await client.query("COMMIT");
    console.log("Parrainages traités avec succès.");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(
      "Erreur lors de la gestion des relations de parrainage :",
      error
    );
  } finally {
    client.release();
  }
}
export async function getParrainLevel(
  idConseiller: number,
  niveau: number
): Promise<string> {
  const client = await db.connect();

  const query = `SELECT prenom_parrain FROM parrainages WHERE filleul_id = $1 AND niveau = $2`;

  try {
    const result = await client.query(query, [idConseiller, niveau]);

    if (result.rows.length > 0) {
      return result.rows[0].prenom_parrain; // Retourne le prénom du parrain
    } else {
      return "Aucun"; // Si aucun résultat trouvé
    }
  } catch (error) {
    console.error(
      `Impossible de récupérer le parrain de niveau ${niveau} :`,
      error
    );
    return "Aucun";
  } finally {
    client.release();
  }
}

/* export async function getParrainLevel2(idConseiller: number): Promise<string> {
  const client = await db.connect();

  const query = `SELECT prenom_parrain FROM parrainages WHERE filleul_id=$1 and niveau=2`;

  try {
    const result = await client.query(query, [idConseiller]);

    if (result.rows.length > 0) {
      return result.rows[0].prenom_parrain; // Retourne le prénom du parrain
    } else {
      return "Aucun"; // Si aucun résultat trouvé
    }
  } catch (error) {
    console.error("Impossible de récupérer le parrain :", error);
    return "Aucun";
  } finally {
    client.release();
  }
}

export async function getParrainLevel3(idConseiller: number): Promise<string> {
  const client = await db.connect();

  const query = `SELECT prenom_parrain FROM parrainages WHERE filleul_id=$1 and niveau=3`;

  try {
    const result = await client.query(query, [idConseiller]);

    if (result.rows.length > 0) {
      return result.rows[0].prenom_parrain; // Retourne le prénom du parrain
    } else {
      return "Aucun"; // Si aucun résultat trouvé
    }
  } catch (error) {
    console.error("Impossible de récupérer le parrain :", error);
    return "Aucun";
  } finally {
    client.release();
  }
} */
