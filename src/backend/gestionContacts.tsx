import db from "@/lib/db";
import { Contact } from "@/lib/types";

export async function getContactIdsFromRelations() {
  const client = await db.connect();
  try {
    const query = `SELECT DISTINCT contact_id FROM contacts_contrats;`;
    const result = await client.query(query);
    return result.rows.map((row) => row.contact_id);
  } catch (error) {
    console.error("Erreur lors de la récupération des contact IDs :", error);
    throw error;
  } finally {
    client.release();
  }
}

export async function insertContacts(contacts: Contact[]) {
  const client = await db.connect();

  if (!Array.isArray(contacts)) {
    throw new Error("Les données des contacts ne sont pas valides.");
  }

  try {
    for (const contact of contacts) {
      const {
        id: contactApimoId,
        prenom,
        nom,
        email,
        mobile,
        phone,
        adresse,
        ville,
      } = contact;

      let villeName;
      let cp;

      if (ville) {
        villeName = ville.name;
        cp = ville.zipcode;
      }

      if (!contactApimoId) {
        console.warn(
          "Contact invalide : contact_apimo_id manquant. Contact ignoré.",
          contact
        );
        continue;
      }

      const query = `
          INSERT INTO contacts (
            contact_apimo_id,
            prenom,
            nom,
            email,
            mobile,
            adresse,
            ville,
            cp
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (contact_apimo_id) DO UPDATE SET
            prenom = EXCLUDED.prenom,
            nom = EXCLUDED.nom,
            email = EXCLUDED.email,
            mobile = EXCLUDED.mobile,
            adresse = EXCLUDED.adresse,
            ville = EXCLUDED.ville,
            cp = EXCLUDED.cp,
            updated_at = NOW();
        `;

      await client.query(query, [
        contactApimoId,
        prenom || null,
        nom || null,
        email || null,
        mobile || phone || null,
        adresse || null,
        villeName || null,
        cp || null,
      ]);
    }

    console.log("Contacts insérés ou mis à jour avec succès.");
  } catch (error) {
    console.error("Erreur lors de l'insertion des contacts :", error);
  } finally {
    client.release();
  }
}
