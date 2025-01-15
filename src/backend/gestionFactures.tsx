"use server";

import db from "../lib/db.js";
import { PoolClient } from "pg";

// Définir un type explicite pour les données du contrat
interface Contrat {
  honoraires: number;
  utilisateur_id: number;
  retrocession: number;
  relationId: number;
  relationid: number;
}

// Fonction principale
export async function createFacture() {
  const client: PoolClient = await db.connect();
  try {
    // 1. Récupérer les contrats
    const getContratsQuery = `
      SELECT c.id AS contrat_id, c.honoraires, r.id as relationid, r.utilisateur_id, u.retrocession, u.parrain_id
      FROM relations_contrats r
      JOIN contrats c ON r.contrat_id = c.id
      JOIN utilisateurs u ON r.utilisateur_id = u.id;
    `;
    const contrats = await client.query(getContratsQuery);

    console.log("Données brutes :", contrats.rows);

    // 2. Créer les factures
    for (const contrat of contrats.rows) {
      await createFactureCommission(contrat, client);
      //await createFactureParrainage(contrat, client);
    }
  } catch (error) {
    console.error("Erreur lors de la création des factures :", error);
  } finally {
    client.release();
  }
}

// Sous-fonction pour créer une facture de type "commission"
async function createFactureCommission(contrat: Contrat, client: PoolClient) {
  try {
    const { honoraires, utilisateur_id, retrocession, relationid } = contrat;

    console.log("Relation ID =", relationid);

    // Calculer le montant de rétrocession
    const retrocessionAmount = (honoraires * (retrocession / 100)).toFixed(2);

    // Insérer la facture de type "commission"
    const insertOrUpdateFactureQuery = `
  INSERT INTO factures (relation_id, user_id, type, honoraires, retrocession_amount, statut_dispo, statut_paiement, created_at, updated_at)
  VALUES ($1, $2, 'commission', $3, $4, 'en attente', 'non payé', NOW(), NOW())
  ON CONFLICT (relation_id)
  DO UPDATE SET
    honoraires = EXCLUDED.honoraires,
    retrocession_amount = EXCLUDED.retrocession_amount,
    statut_dispo = EXCLUDED.statut_dispo,
    statut_paiement = EXCLUDED.statut_paiement,
    updated_at = NOW();
`;
    await client.query(insertOrUpdateFactureQuery, [
      relationid,
      utilisateur_id,
      honoraires,
      retrocessionAmount,
    ]);

    console.log(
      `Facture commission créée pour l'utilisateur ${utilisateur_id}`
    );
  } catch (error) {
    console.error(
      "Erreur lors de la création de la facture de type commission :",
      error
    );
  }
}

/* // Sous-fonction pour créer des factures de type "parrainage"
async function createFactureParrainage(contrat: Contrat, client: PoolClient) {
  try {
    const { honoraires, utilisateur_id } = contrat;

    // Récupérer les parrains (niveaux 1, 2, et 3)
    const getParrainsQuery = `
      WITH RECURSIVE parrains_cte AS (
        SELECT id, prenom, parrain_id, 1 AS niveau
        FROM utilisateurs
        WHERE id = $1
        UNION ALL
        SELECT u.id, u.prenom, u.parrain_id, cte.niveau + 1
        FROM utilisateurs u
        JOIN parrains_cte cte ON u.id = cte.parrain_id
        WHERE cte.niveau < 3
      )
      SELECT id, prenom, niveau FROM parrains_cte WHERE niveau > 1;
    `;
    const parrains = await client.query(getParrainsQuery, [utilisateur_id]);

    for (const parrain of parrains.rows) {
      const { id: parrainId, niveau } = parrain;

      // Déterminer le pourcentage selon le niveau
      const percentage = niveau === 2 ? 6 : niveau === 3 ? 2 : 1;
      const parrainRetrocessionAmount = (
        honoraires *
        (percentage / 100)
      ).toFixed(2);

      // Insérer la facture de type "parrainage"
      const insertParrainageQuery = `
        INSERT INTO factures (user_id, type, honoraires, retrocession_amount, statut_dispo, statut_paiement, created_at, updated_at)
        VALUES ($1, 'parrainage', $2, $3, 'en attente', 'non payé', NOW(), NOW())
        ON CONFLICT DO NOTHING;
      `;
      await client.query(insertParrainageQuery, [
        parrainId,
        honoraires,
        parrainRetrocessionAmount,
      ]);

      console.log(
        `Facture parrainage créée pour le parrain ${parrainId} (niveau ${niveau})`
      );
    }
  } catch (error) {
    console.error(
      "Erreur lors de la création des factures de type parrainage :",
      error
    );
  }
} */

export async function getFactures(userId: number) {
  const client = await db.connect();

  try {
    
    const queryGetFactures = `SELECT`

  

    // 3. Retourner les factures avec les informations supplémentaires
    console.log(result.rows);
    return result.rows;
  } catch (error) {
    console.error(
      `Erreur lors de la récupération des factures pour user_id ${userId} :`,
      error
    );
    throw error; // Relancer l'erreur pour la gestion ultérieure
  } finally {
    // 4. Libérer le client après l'exécution
    client.release();
  }
}
