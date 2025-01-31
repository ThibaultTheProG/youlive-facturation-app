import {
  getContactIdsFromRelations,
  insertContacts,
} from "@/backend/gestionContacts";
import { Contacts } from "@/lib/types";

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

    // Vérification de la réponse
    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: "Échec de la récupération des contacts" }),
        { status: response.status }
      );
    }

    // Récupérer les contacts depuis la réponse API
    const brut = await response.json();
    const contacts: Contacts[] = brut.contacts || [];

    // Filtrer les contacts dont l'ID est présent dans la base de données
    const filteredContacts = contacts.filter((contact) =>
      contactIds.includes(String(contact.id))
    );

    // Vérification : Aucun contact filtré
    if (filteredContacts.length === 0) {
      return new Response(
        JSON.stringify({ message: "Aucun contact correspondant trouvé." }),
        { status: 200 }
      );
    }

    await insertContacts(filteredContacts);

    // Retourner les contacts filtrés
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
