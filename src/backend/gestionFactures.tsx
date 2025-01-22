"use server";

import db from "../lib/db.js";
import { PoolClient } from "pg";
import { RelationContrat } from "@/lib/types.js";

// Fonction principale
export async function createFacture() {
  const client: PoolClient = await db.connect();
  try {
    await client.query("BEGIN"); // Démarrer une transaction

    // 1. Récupérer les contrats
    const getContratsQuery = `
      SELECT c.id AS contrat_id, c.honoraires, r.id as relationid, r.user_id, u.retrocession, u.parrain_id
      FROM relations_contrats r
      JOIN contrats c ON r.contrat_id = c.id
      JOIN utilisateurs u ON r.user_id = u.id;
    `;
    const contrats = await client.query(getContratsQuery);

    // 2. Créer les factures pour chaque contrat
    for (const contrat of contrats.rows) {
      await createFactureCommission(contrat, client);
      await createFactureParrainage(contrat, client);
    }

    await client.query("COMMIT"); // Valider la transaction
    console.log("Factures créées avec succès.");
  } catch (error) {
    await client.query("ROLLBACK"); // Annuler en cas d'erreur
    console.error("Erreur lors de la création des factures :", error);
  } finally {
    client.release();
  }
}

//Sous-fonction pour créer une facture de type "commission"
async function createFactureCommission(
  contrat: RelationContrat,
  client: PoolClient
) {
  try {
    const { honoraires, user_id, retrocession, relationid } = contrat;

    console.log("Relation ID =", relationid);

    // Calculer le montant de rétrocession
    const retrocessionAmount = (honoraires * (retrocession / 100)).toFixed(2);

    // Insérer la facture de type "commission"
    const insertOrUpdateFactureQuery = `
  INSERT INTO factures (relation_id, user_id, type, retrocession, statut_dispo, statut_paiement, created_at, updated_at)
  VALUES ($1, $2, 'commission', $3, 'en attente', 'non payé', NOW(), NOW())
  ON CONFLICT (relation_id, type, user_id)
  DO UPDATE SET
    retrocession = EXCLUDED.retrocession,
    statut_dispo = EXCLUDED.statut_dispo,
    statut_paiement = EXCLUDED.statut_paiement,
    updated_at = NOW();
`;
    await client.query(insertOrUpdateFactureQuery, [
      relationid,
      user_id,
      retrocessionAmount,
    ]);

    console.log(
      `Facture commission créée pour l'utilisateur ${user_id}`
    );
  } catch (error) {
    console.error(
      "Erreur lors de la création de la facture de type commission :",
      error
    );
  }
} 

// Sous-fonction pour créer des factures de type "parrainage"
async function createFactureParrainage(
  contrat: RelationContrat,
  client: PoolClient
) {
  try {
    const { honoraires, user_id, relationid } = contrat;

    const getParrainsQuery = `
      WITH RECURSIVE parrains_cte AS (
        SELECT id AS parrain_id, prenom, 1 AS niveau
        FROM utilisateurs
        WHERE id = $1

        UNION ALL

        SELECT p.parrain_id, u.prenom, cte.niveau + 1 AS niveau
        FROM parrainages p
        JOIN utilisateurs u ON u.id = p.parrain_id
        JOIN parrains_cte cte ON cte.parrain_id = p.filleul_id
        WHERE cte.niveau < 3
      )
      SELECT parrain_id, niveau FROM parrains_cte;
    `;

    const parrains = await client.query(getParrainsQuery, [user_id]);

    if (parrains.rows.length === 0) {
      console.log("Aucun parrain trouvé pour l'utilisateur :", user_id);
      return;
    }

    for (const parrain of parrains.rows) {
      const { parrain_id, niveau } = parrain;
      const percentage = niveau === 1 ? 6 : niveau === 2 ? 2 : 1;
      const retrocessionAmount = (honoraires * (percentage / 100)).toFixed(2);

      try {
        await client.query("SAVEPOINT before_insert");

        const insertParrainageQuery = `
          INSERT INTO factures (relation_id, user_id, type, retrocession, statut_dispo, statut_paiement, created_at, updated_at)
          VALUES ($1, $2, 'parrainage', $3, 'en attente', 'non payé', NOW(), NOW())
          ON CONFLICT (relation_id, type, user_id)
          DO UPDATE SET
            retrocession = EXCLUDED.retrocession,
            statut_dispo = EXCLUDED.statut_dispo,
            statut_paiement = EXCLUDED.statut_paiement,
            updated_at = NOW();
        `;
        await client.query(insertParrainageQuery, [
          relationid,
          parrain_id,
          retrocessionAmount,
        ]);

        await client.query("RELEASE SAVEPOINT before_insert");
        console.log(
          `Facture parrainage créée/mise à jour pour le parrain ${parrain_id} (niveau ${niveau}).`
        );
      } catch (error) {
        console.error("Erreur lors de l'insertion ou mise à jour :", error);
        await client.query("ROLLBACK TO SAVEPOINT before_insert");
      }
    }
  } catch (error) {
    console.error(
      "Erreur lors de la création des factures de type parrainage :",
      error
    );
  }
}

export async function getFactures(userId: number) {
  const client = await db.connect();

  try {
    const queryGetFactures = `
        SELECT 
          f.type, 
          r.honoraires_agent, 
          f.retrocession, 
          p.numero_mandat, 
          c.date_signature, 
          f.statut_dispo
        FROM factures f
        JOIN relations_contrats r ON f.relation_id = r.id
        JOIN contrats c ON r.contrat_id = c.id
        JOIN property p ON c.id = p.contrat_id
        WHERE f.user_id = $1;
      `;

    const result = await client.query(queryGetFactures, [userId]);

    // Log des résultats pour debug
    console.log("Factures récupérées :", result.rows);

    return result.rows;
  } catch (error) {
    console.error(
      `Erreur lors de la récupération des factures pour user_id ${userId} :`,
      error
    );
    throw error; // Relancer l'erreur pour la gestion ultérieure
  } finally {
    // Libérer le client après exécution
    client.release();
  }
}
