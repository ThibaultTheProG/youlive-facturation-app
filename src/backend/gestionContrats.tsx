import db from "../lib/db.js";

export async function insertContrats(contrats: object) {
  const client = await db.connect();

  if (!Array.isArray(contrats)) {
    throw new Error("Les données des contrats ne sont pas valides.");
  }

  try {
    for (const contrat of contrats) {
      const {
        id,
        step,
        property,
        price,
        price_net,
        commission,
        contract_at,
        entries,
        contacts,
      } = contrat;

      // Validation des champs principaux
      if (
        !id ||
        !step ||
        !property ||
        !price ||
        !price_net ||
        !commission ||
        !contract_at
      ) {
        console.error(
          "Contrat invalide, certains champs requis sont manquants :",
          contrat
        );
        continue;
      }

      // Conversion des valeurs en types appropriés
      const idNumber = Number(id);
      const stepNumber = Number(step);
      const propertyNumber = Number(property);
      const priceNumber = Number(price);
      const priceNetNumber = Number(price_net);
      const commissionNumber = Number(commission);
      const contractAt = new Date(contract_at);

      const queryContrat = `
  INSERT INTO contrats 
    (idcontratapimo, statut, property_id, price, price_net, honoraires, date_signature) 
  VALUES ($1, $2, $3, $4, $5, $6, $7) 
  ON CONFLICT (idcontratapimo) 
  DO UPDATE SET
    statut = EXCLUDED.statut,
    property_id = EXCLUDED.property_id,
    price = EXCLUDED.price,
    price_net = EXCLUDED.price_net,
    honoraires = EXCLUDED.honoraires,
    date_signature = EXCLUDED.date_signature
  RETURNING id;
`;

      const resultContrat = await client.query(queryContrat, [
        idNumber,
        stepNumber,
        propertyNumber,
        priceNumber,
        priceNetNumber,
        commissionNumber,
        contractAt,
      ]);

      const contratId = resultContrat.rows[0].id;

      // Insérer les relations
      if (entries && Array.isArray(entries)) {
        for (const entry of entries) {
          const { user, amount, vat, vat_rate } = entry;

          if (!user || !amount || !vat || !vat_rate) {
            console.warn(
              "Relation invalide, certains champs requis sont manquants :",
              entry
            );
            continue;
          }

          const userNumber = Number(user);
          const amountNumber = Number(amount);
          const vatNumber = Number(vat);
          const vatRateNumber = Number(vat_rate);

          const queryUtilisateur = `
            SELECT id 
            FROM utilisateurs 
            WHERE idapimo = $1;
          `;
          const resultUtilisateur = await client.query(queryUtilisateur, [
            userNumber,
          ]);

          if (resultUtilisateur.rows.length === 0) {
            console.warn(
              `Utilisateur avec idapimo ${userNumber} non trouvé, relation ignorée.`
            );
            continue;
          }

          const utilisateurId = resultUtilisateur.rows[0].id;
          // Vérifier si le contrat appartient à l'année en cours
          const currentYear = new Date().getFullYear();
          const contractYear = contractAt.getFullYear();

          console.warn("Current year :", currentYear, "Contract Year :", contractYear);

          if (contractYear === currentYear) {
            // Insérer la relation avec un ON CONFLICT pour éviter les doublons
            const queryRelation = `
    INSERT INTO relations_contrats (contrat_id, user_id, honoraires_agent, vat, vat_rate) 
    VALUES ($1, $2, $3, $4, $5) 
    ON CONFLICT (contrat_id, user_id) DO NOTHING
    RETURNING user_id, honoraires_agent;
  `;

            const resultRelation = await client.query(queryRelation, [
              contratId,
              utilisateurId,
              amountNumber,
              vatNumber,
              vatRateNumber,
            ]);

            // Si la relation a été insérée (donc nouvelle), on met à jour le chiffre d'affaires
            if (resultRelation.rows.length > 0) {
              const updateChiffreAffairesQuery = `
      UPDATE utilisateurs 
      SET chiffre_affaires = chiffre_affaires + $1 
      WHERE id = $2;
    `;

              await client.query(updateChiffreAffairesQuery, [
                amountNumber,
                utilisateurId,
              ]);
            }
          }
        }
      }

      // Insérer les contacts
      if (contacts && Array.isArray(contacts)) {
        for (const contact of contacts) {
          const { contact: contactId, type } = contact;

          // Ne pas insérer les contacts avec le type 3 ou 4
          if (!contactId || !type || type === "3" || type === "4") {
            /* console.warn(
              `Contact avec ID ${contactId} et type ${type} ignoré (type 3 ou 4 ou invalide).`
            ); */
            continue;
          }

          const queryContactContrat = `
      INSERT INTO contacts_contrats (contrat_id, contact_id, type)
      VALUES ($1, $2, $3)
      ON CONFLICT (contrat_id, contact_id) DO NOTHING;
    `;

          await client.query(queryContactContrat, [
            contratId,
            Number(contactId),
            Number(type),
          ]);
        }
      }
    }

    console.log("Contrats et relations insérés avec succès");
  } catch (error) {
    console.error("Erreur lors de l'insertion des contrats :", error);
  } finally {
    client.release();
  }
}
