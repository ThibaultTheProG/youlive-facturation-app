"use server";

import prisma from "@/lib/db";
import { Contact } from "@/lib/types";

export async function getContactIdsFromRelations() {
  try {
    const contacts = await prisma.contacts_contrats.findMany({
      distinct: ['contact_id'],
      select: {
        contact_id: true
      }
    });
    return contacts.map((row) => row.contact_id);
  } catch (error) {
    console.error("Erreur lors de la récupération des contact IDs :", error);
    throw error;
  }
}

export async function insertContacts(contacts: Contact[]) {
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

      const villeName = ville?.name;
      const cp = ville?.zipcode;

      if (!contactApimoId) {
        console.warn(
          "Contact invalide : contact_apimo_id manquant. Contact ignoré.",
          contact
        );
        continue;
      }

      await prisma.contacts.upsert({
        where: {
          contact_apimo_id: contactApimoId
        },
        update: {
          prenom: prenom || null,
          nom: nom || null,
          email: email || null,
          mobile: mobile || phone || null,
          adresse: adresse || null,
          ville: villeName || null,
          cp: cp || null,
          updated_at: new Date()
        },
        create: {
          contact_apimo_id: contactApimoId,
          prenom: prenom || null,
          nom: nom || null,
          email: email || null,
          mobile: mobile || phone || null,
          adresse: adresse || null,
          ville: villeName || null,
          cp: cp || null
        }
      });
    }

    console.log("✅ Contacts insérés ou mis à jour avec succès.");
  } catch (error) {
    console.error("❌ Erreur lors de l'insertion des contacts :", error);
    throw error;
  }
}
