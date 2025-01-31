"use server";

import db from "../lib/db.js";
import { PoolClient } from "pg";
import { FactureDetaillee, RelationContrat } from "@/lib/types.js";

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
    if (chiffreAffaires >= 70000) {
      console.log(
        `L'utilisateur ${user_id} a un chiffre d'affaires >= 70 000€. Aucune facture de parrainage générée.`
      );
      return;
    }

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
      const retrocessionAmount = (
        honoraires_agent *
        (percentage / 100)
      ).toFixed(2);

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
          f.statut_dispo,
          f.url_fichier
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
  try {
    const query = `
SELECT 
    f.id,
    f.user_id,
    f.type,
    r.honoraires_agent, -- ✅ Récupération des honoraires depuis relations_contrats
    f.retrocession,
    f.statut_dispo,
    f.statut_paiement,
    f.url_fichier,
    f.created_at,
    f.updated_at,
    c.date_signature,
    p.numero_mandat,
    r.user_id,

    -- Informations du conseiller (utilisateur)
    u.id AS conseiller_id,
    u.prenom AS conseiller_prenom,
    u.nom AS conseiller_nom,
    u.email AS conseiller_email,
    u.telephone AS conseiller_telephone,
    u.adresse AS conseiller_adresse,
    u.siren AS conseiller_siren,
    u.tva AS conseiller_tva,
    u.chiffre_affaires AS conseiller_chiffre_affaires,
    u.retrocession AS conseiller_retrocession,

    -- Informations du contrat
    c.id AS contrat_id,
    c.statut AS contrat_statut,
    c.price AS contrat_price,
    c.price_net AS contrat_price_net,

    -- Informations de la propriété
    p.id AS propriete_id,
    p.adresse AS propriete_adresse,

    -- Informations du filleul (utilisateur associé à relations_contrats.user_id)
    filleul.prenom AS filleul_prenom,
    filleul.nom AS filleul_nom,

    -- Agrégation des acheteurs sous format JSON
    COALESCE(
        json_agg(
            DISTINCT CASE 
                WHEN cc_acheteur.type = 1 THEN 
                    jsonb_build_object(
                        'prenom', acheteur.prenom,
                        'nom', acheteur.nom,
                        'email', acheteur.email,
                        'mobile', acheteur.mobile,
                        'adresse', acheteur.adresse,
                        'ville', acheteur.ville,
                        'cp', acheteur.cp
                    )
            END
        ) FILTER (WHERE cc_acheteur.type = 1), '[]'
    ) AS acheteurs,

    -- Agrégation des propriétaires sous format JSON
    COALESCE(
        json_agg(
            DISTINCT CASE 
                WHEN cc_proprietaire.type = 2 THEN 
                    jsonb_build_object(
                        'prenom', proprietaire.prenom,
                        'nom', proprietaire.nom,
                        'email', proprietaire.email,
                        'mobile', proprietaire.mobile,
                        'adresse', proprietaire.adresse,
                        'ville', proprietaire.ville,
                        'cp', proprietaire.cp
                    )
            END
        ) FILTER (WHERE cc_proprietaire.type = 2), '[]'
    ) AS proprietaires

FROM factures f
JOIN relations_contrats r ON f.relation_id = r.id  -- ✅ Récupération des honoraires_agent
JOIN utilisateurs u ON f.user_id = u.id
JOIN contrats c ON r.contrat_id = c.id
JOIN property p ON c.id = p.contrat_id

LEFT JOIN utilisateurs filleul ON r.user_id = filleul.id

-- Jointure pour récupérer les acheteurs (type = 1)
LEFT JOIN contacts_contrats cc_acheteur ON c.id = cc_acheteur.contrat_id AND cc_acheteur.type = 1
LEFT JOIN contacts acheteur ON cc_acheteur.contact_id = acheteur.contact_apimo_id

-- Jointure pour récupérer les propriétaires (type = 2)
LEFT JOIN contacts_contrats cc_proprietaire ON c.id = cc_proprietaire.contrat_id AND cc_proprietaire.type = 2
LEFT JOIN contacts proprietaire ON cc_proprietaire.contact_id = proprietaire.contact_apimo_id

WHERE f.id = $1
GROUP BY 
    f.id, u.id, c.id, p.id, r.honoraires_agent, r.user_id, filleul.prenom, filleul.nom;
    `;

    const result = await client.query(query, [factureId]);
    if (result.rows.length === 0) return null;

    const row = result.rows[0];

    return {
      id: row.id,
      type: row.type,
      honoraires_agent: row.honoraires_agent, // ✅ Correction ici pour prendre depuis relations_contrats
      retrocession: row.retrocession,
      statut_dispo: row.statut_dispo,
      statut_paiement: row.statut_paiement,
      url_fichier: row.url_fichier,
      created_at: row.created_at,
      updated_at: row.updated_at,
      numero_mandat: row.numero_mandat,
      date_signature: row.date_signature,

      filleul: {
        id: row.user_id,
        prenom: row.filleul_prenom,
        nom: row.filleul_nom
      },

      conseiller: {
        id: row.conseiller_id,
        prenom: row.conseiller_prenom,
        nom: row.conseiller_nom,
        email: row.conseiller_email,
        telephone: row.conseiller_telephone,
        adresse: row.conseiller_adresse,
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
