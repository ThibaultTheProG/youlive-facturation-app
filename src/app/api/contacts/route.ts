import {
  getContactIdsFromRelations,
  insertContacts,
} from "@/backend/gestionContacts";
import { Contact, ContactApi } from "@/lib/types";

function mapApiContact(apiContact: ContactApi): Contact {
  return {
    id: apiContact.id,
    prenom: apiContact.firstname, // ✅ Conversion `firstname` → `prenom`
    nom: apiContact.lastname, // ✅ Conversion `lastname` → `nom`
    email: apiContact.email,
    mobile: apiContact.mobile || null, // ✅ Utilise `mobile_phone`
    phone: apiContact.phone || null, // ✅ Utilise `home_phone`
    adresse: apiContact.address, // ✅ Conversion `address` → `adresse`
    ville: {
      name: apiContact.city?.name || "",
      zipcode: apiContact.city?.zipcode || "",
    },
  };
}

export async function GET() {
  try {
    // Récupérer les IDs de contacts depuis la base de données
    const contactIds = await getContactIdsFromRelations();

    if (!contactIds || contactIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "Aucun contact à récupérer." }),
        { status: 404 }
      );
    }

    // Appeler l'API pour récupérer tous les contacts
    const response = await fetch(
      "https://api.apimo.pro/agencies/24045/contacts",
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${process.env.USERNAME}:${process.env.PASSWORD}`
          ).toString("base64")}`,
          cache: "force-cache",
        },
      }
    );

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: "Échec de la récupération des contacts" }),
        { status: response.status }
      );
    }

    const brut = await response.json();
    const contactsApi = brut.contacts || [];

    // 🔄 Convertir les champs anglais → français avant insertion
    const contactsMapped: Contact[] = contactsApi.map(mapApiContact);

    // Filtrer les contacts dont l'ID est présent dans la base de données
    const filteredContacts = contactsMapped.filter((contact) =>
      contactIds.includes(contact.id)
    );

    console.log(filteredContacts);

    if (filteredContacts.length === 0) {
      return new Response(
        JSON.stringify({ message: "Aucun contact correspondant trouvé." }),
        { status: 200 }
      );
    }

    await insertContacts(filteredContacts);

    return new Response(JSON.stringify({ data: filteredContacts }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des contacts :", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur." }),
      { status: 500 }
    );
  }
}
