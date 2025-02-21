"use server";

import db from "../lib/db.js";
import { PoolClient } from "pg";
import { FactureDetaillee, RelationContrat } from "@/lib/types.js";
import fs from "fs/promises";
import path from "path";

// Fonction principale
export async function createFacture() {
  const client: PoolClient = await db.connect();
  try {
    await client.query("BEGIN"); // Démarrer une transaction

    // 1. Récupérer les contrats
    const getContratsQuery = `
      SELECT c.id AS contrat_id, r.honoraires_agent, r.id as relationid, r.user_id, u.retrocession, u.parrain_id
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

// Sous-fonction pour créer une facture de type "commission"
async function createFactureCommission(
  contrat: RelationContrat,
  client: PoolClient
) {
  try {
    const { honoraires_agent, user_id, retrocession, relationid } = contrat;

    console.log("Honoraire agent : ", honoraires_agent);
    console.log("Relation ID =", relationid);
    console.log("Retrocession :", retrocession);

    // Ne pas générer la facture si la rétrocession est strictement inférieure à 60
    if (retrocession < 60) {
      console.log(
        `Facture de commission non créée pour l'utilisateur ${user_id} car la rétrocession (${retrocession}) est inférieure à 60.`
      );
      return; // Arrêter l'exécution
    }

    // Calculer le montant de rétrocession
    const retrocessionAmount = (
      honoraires_agent *
      (retrocession / 100)
    ).toFixed(2);

    // Insérer la facture de type "commission"
    const insertOrUpdateFactureQuery = `
  INSERT INTO factures (relation_id, user_id, type, retrocession, statut_paiement)
  VALUES ($1, $2, 'commission', $3, 'non payé')
  ON CONFLICT (relation_id, type, user_id)
  DO UPDATE SET
    retrocession = EXCLUDED.retrocession
`;
    await client.query(insertOrUpdateFactureQuery, [
      relationid,
      user_id,
      retrocessionAmount,
    ]);

    console.log(`Facture commission créée pour l'utilisateur ${user_id}`);
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
    const { honoraires_agent, user_id, relationid } = contrat;

    // Vérifier le chiffre d'affaires de l'utilisateur
    const checkChiffreAffairesQuery = `
SELECT chiffre_affaires
FROM utilisateurs
WHERE id = $1;
`;

    const result = await client.query(checkChiffreAffairesQuery, [user_id]);

    if (result.rows.length === 0) {
      console.log("Utilisateur non trouvé :", user_id);
      return;
    }

    const chiffreAffaires = result.rows[0].chiffre_affaires;

    // Si CA >= 70 000€, ne pas générer de facture de parrainage
    if (chiffreAffaires > 70000) {
      console.log(
        `L'utilisateur ${user_id} a un chiffre d'affaires > 70 000€. Aucune facture de parrainage générée.`
      );
      return;
    }

    const getParrainsQuery = `
      WITH RECURSIVE parrains_cte AS (
  -- ✅ Récupérer les parrains directs, mais exclure les utilisateurs auto-parrainés
  SELECT p.parrain_id, u.prenom, 1 AS niveau
  FROM parrainages p
  JOIN utilisateurs u ON u.id = p.parrain_id
  WHERE p.filleul_id = $1
  AND (SELECT auto_parrain FROM utilisateurs WHERE id = $1) != 'oui' -- ✅ Exclure les auto-parrainés

  UNION ALL

  -- ✅ Continuer la récursivité pour les niveaux supérieurs (jusqu'à 3)
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
      console.log(
        `Aucun parrain trouvé ou utilisateur ${user_id} est auto-parrainé.`
      );
      return;
    }

    for (const parrain of parrains.rows) {
      const { parrain_id, niveau } = parrain;
      // Vérifier le nombre de filleuls de niveau 1 dans la table utilisateurs
      const checkFilleulsQuery = `
    SELECT COUNT(*) AS nombre_filleuls
    FROM utilisateurs
    WHERE parrain_id = $1;
  `;

      const resultFilleuls = await client.query(checkFilleulsQuery, [
        parrain_id,
      ]);
      const nombreFilleuls = parseInt(
        resultFilleuls.rows[0].nombre_filleuls,
        10
      );

      // Si le parrain a 5 filleuls ou plus de niveau 1, passer la rétrocession à 8% au lieu de 6%
      const percentage =
        niveau === 1 ? (nombreFilleuls >= 5 ? 8 : 6) : niveau === 2 ? 2 : 1;

      const retrocessionAmount = (
        honoraires_agent *
        (percentage / 100)
      ).toFixed(2);

      try {
        await client.query("SAVEPOINT before_insert");

        const insertParrainageQuery = `
          INSERT INTO factures (relation_id, user_id, type, retrocession, statut_paiement)
          VALUES ($1, $2, 'recrutement', $3, 'non payé')
          ON CONFLICT (relation_id, type, user_id)
          DO UPDATE SET
            retrocession = EXCLUDED.retrocession
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

// Récupérer les factures qui sont dans la BDD
export async function getFactures(userId: number) {
  const client = await db.connect();

  try {
    const queryGetFactures = `
        SELECT
          f.id,
          f.type, 
          r.honoraires_agent, 
          f.retrocession, 
          p.numero_mandat, 
          c.date_signature, 
          f.statut_paiement,
          f.numero,
          f.created_at,
          f.apporteur,
          f.apporteur_amount
        FROM factures f
        JOIN relations_contrats r ON f.relation_id = r.id
        JOIN contrats c ON r.contrat_id = c.id
        JOIN property p ON c.id = p.contrat_id
        WHERE f.user_id = $1;
      `;

    const result = await client.query(queryGetFactures, [userId]);

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

// Récupérer une facture depuis son ID
export async function getFactureById(
  factureId: number
): Promise<FactureDetaillee | null> {
  const client = await db.connect();

  const sqlFilePath = path.join(
    process.cwd(),
    "src/query",
    "getFacturesById.sql"
  );
  const sqlQuery = await fs.readFile(sqlFilePath, "utf-8");

  try {
    const result = await client.query(sqlQuery, [factureId]);
    if (result.rows.length === 0) return null;

    const row = result.rows[0];

    console.log("Acheteurs :", row.acheteurs ?? []);
    console.log("Propriétaires :", row.proprietaires ?? []);

    return {
      id: row.id,
      type: row.type,
      honoraires_agent: row.honoraires_agent,
      retrocession: row.retrocession,
      statut_paiement: row.statut_paiement,
      created_at: row.created_at,
      numero_mandat: row.numero_mandat,
      date_signature: row.date_signature,
      numero: row.numero,
      vat_rate: row.vat_rate,
      apporteur: row.apporteur,
      apporteur_amount: row.apporteur_amount,

      filleul: {
        id: row.user_id,
        prenom: row.filleul_prenom,
        nom: row.filleul_nom,
      },

      conseiller: {
        idapimo: row.conseiller_idapimo,
        id: row.conseiller_id,
        prenom: row.conseiller_prenom,
        nom: row.conseiller_nom,
        email: row.conseiller_email,
        telephone: row.conseiller_telephone,
        adresse: row.conseiller_adresse,
        mobile: row.conseiller_mobile,
        siren: row.conseiller_siren,
        tva: row.conseiller_tva,
        chiffre_affaires: row.conseiller_chiffre_affaires,
        retrocession: row.conseiller_retrocession,
      },

      contrat: {
        id: row.contrat_id,
        step: row.contrat_step,
        price: row.contrat_price,
        price_net: row.contrat_price_net,
        commission: row.contrat_commission,
        date_signature: row.date_signature,
      },

      propriete: {
        id: row.propriete_id,
        adresse: row.propriete_adresse,
        reference: row.propriete_reference,
      },
      acheteurs: row.acheteurs ?? [],
      proprietaires: row.proprietaires ?? [],
    };
  } catch (error) {
    console.error("Erreur lors de la récupération de la facture :", error);
    return null;
  } finally {
    client.release();
  }
}
