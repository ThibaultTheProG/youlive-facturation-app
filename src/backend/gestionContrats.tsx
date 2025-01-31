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
        updated_at,
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
        !updated_at
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
      const updatedAtDate = new Date(updated_at);

      const queryContrat = `
        INSERT INTO contrats 
          (idcontratapimo, statut, property_id, price, price_net, honoraires, date_signature) 
        VALUES ($1, $2, $3, $4, $5, $6, $7) 
        ON CONFLICT (idcontratapimo) DO NOTHING 
        RETURNING id;
      `;

      const resultContrat = await client.query(queryContrat, [
        idNumber,
        stepNumber,
        propertyNumber,
        priceNumber,
        priceNetNumber,
        commissionNumber,
        updatedAtDate,
      ]);

      // Si le contrat existe déjà, ignorer
      if (resultContrat.rows.length === 0) {
        console.log(`Contrat ${idNumber} déjà existant, insertion ignorée.`);
        continue;
      }

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

          const queryRelation = `
            INSERT INTO relations_contrats 
              (contrat_id, user_id, honoraires_agent, vat, vat_rate) 
            VALUES ($1, $2, $3, $4, $5) 
            ON CONFLICT (contrat_id, user_id) DO NOTHING;
          `;

          await client.query(queryRelation, [
            contratId,
            utilisateurId,
            amountNumber,
            vatNumber,
            vatRateNumber,
          ]);
        }
      }

      // Insérer les contacts
      if (contacts && Array.isArray(contacts)) {
        for (const contact of contacts) {
          const { contact: contactId, type } = contact;

          // Ne pas insérer les contacts avec le type 3 ou 4
          if (!contactId || !type || type === "3" || type === "4") {
            console.warn(
              `Contact avec ID ${contactId} et type ${type} ignoré (type 3 ou 4 ou invalide).`
            );
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
