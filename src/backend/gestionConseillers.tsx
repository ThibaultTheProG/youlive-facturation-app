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
      const { id, firstname, lastname, email, phone, mobile, city, partners } =
        conseiller;
      const adresse = city?.name || null;
      const createdAt = new Date();
      const siren = partners?.[0]?.reference;

      if (!firstname || !lastname) {
        continue; // Ignorer cet enregistrement
      }
      const query = `
    INSERT INTO utilisateurs (idApimo, prenom, nom, email, telephone, mobile, adresse, role, created_at, siren) 
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
ON CONFLICT (idApimo) 
DO UPDATE SET 
  prenom = EXCLUDED.prenom,
  nom = EXCLUDED.nom,
  email = EXCLUDED.email,
  telephone = EXCLUDED.telephone,
  mobile = EXCLUDED.mobile,
  role = EXCLUDED.role,
  siren = EXCLUDED.siren,
  updated_at = NOW()
RETURNING *;
  `;

      await client.query(query, [
        id,
        firstname || null,
        lastname || null,
        email || null,
        phone || null,
        mobile || null,
        adresse,
        "conseiller",
        createdAt,
        siren,
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

export async function updateConseillerBDD(
  formData: FormData,
  id: number,
  parrain_id?: number | null
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

  let query;

  if (!parrain_id) {
    query = `
    UPDATE utilisateurs
    SET 
      adresse = $1, 
      siren = $2, 
      tva = $3, 
      typecontrat = $4, 
      chiffre_affaires = $5, 
      retrocession = $6,
      updated_at = NOW()
    WHERE id = $7;
  `;
  } else {
    query = `
    UPDATE utilisateurs
    SET 
      adresse = $1, 
      siren = $2, 
      tva = $3, 
      typecontrat = $4, 
      chiffre_affaires = $5, 
      retrocession = $6,
      parrain_id = $7,
      updated_at = NOW()
    WHERE id = $8;
  `;
  }

  try {
    if (!parrain_id) {
      await client.query(query, [
        rawFormData.localisation,
        siren,
        tva,
        rawFormData.type_contrat,
        chiffreAffaires,
        retrocession,
        id,
      ]);
    } else {
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
    }

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

export async function handleParrainages(
  selectedParrain: string,
  parrainId: number
) {
  const client = await db.connect();

  try {
    console.log(
      `Gestion des relations pour le parrain sélectionné ${selectedParrain} et son filleul avec l'id ${parrainId}`
    );

    // Récupérer les filleuls directs (niveau 1) du parrain sélectionné
    const getFilleuls = `
      SELECT id, prenom
      FROM utilisateurs
      WHERE parrain_id = $1;
    `;
    const filleuls = await client.query(getFilleuls, [parrainId]);

    console.log("Filleuls de premier niveau :", filleuls.rows);

    // Gestion 1 er niveau
    if (filleuls.rows[0]) {
      console.log("Lancement de la boucle sur les filleuls de premier niveau");
      for (const filleul of filleuls.rows) {
        const getFilleuls = `
        SELECT id, prenom
        FROM utilisateurs
        WHERE parrain_id = $1;
      `;
        const filleuls = await client.query(getFilleuls, [filleul.id]);

        console.log("Filleuls de deuxième niveau :", filleuls.rows);

        // Gestion 2 ème niveau
        if (filleuls.rows[0]) {
          console.log(
            "Lancement de la boucle sur les filleuls de deuxième niveau"
          );
          for (const filleul of filleuls.rows) {
            const insertRelation2 = `INSERT INTO parrainages (prenom_filleul, filleul_id, prenom_parrain, parrain_id, niveau)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (filleul_id, parrain_id, niveau) DO NOTHING;`;

            client.query(insertRelation2, [
              filleul.prenom,
              filleul.id,
              selectedParrain,
              parrainId,
              2,
            ]);

            const getFilleuls = `
        SELECT id, prenom
        FROM utilisateurs
        WHERE parrain_id = $1;
      `;
            const filleuls = await client.query(getFilleuls, [filleul.id]);

            console.log("Filleuls de troisième niveau :", filleuls.rows);
            // Gestion 3 ème niveau
            if (filleuls.rows[0]) {
              console.log(
                "Lancement de la boucle sur les filleuls de troisième niveau"
              );
              for (const filleul of filleuls.rows) {
                const insertRelation2 = `INSERT INTO parrainages (prenom_filleul, filleul_id, prenom_parrain, parrain_id, niveau)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (filleul_id, parrain_id, niveau) DO NOTHING;`;

                client.query(insertRelation2, [
                  filleul.prenom,
                  filleul.id,
                  selectedParrain,
                  parrainId,
                  3,
                ]);

                console.log("Fin de la logique de parrainage.");
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error(
      "Erreur lors de la gestion des relations de parrainage :",
      error
    );
  } finally {
    client.release();
  }
}
