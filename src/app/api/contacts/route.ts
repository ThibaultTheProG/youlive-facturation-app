import prisma from "@/lib/db";
import { Contact, ContactApi } from "@/lib/types";
import { NextResponse } from "next/server";
import { ApimoError, fetchApimoAll } from "@/utils/apimo";
import { memeTexte, runChunked } from "@/utils/sync";
import { requireCronOrAdmin } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

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

export async function GET(request: Request) {
  const auth = await requireCronOrAdmin(request);
  if ("error" in auth) return auth.error;

  const debut = Date.now();
  try {
    // Contacts effectivement rattachés à un contrat : seuls ceux-là nous intéressent
    const references = await prisma.contacts_contrats.findMany({
      distinct: ["contact_id"],
      select: { contact_id: true },
    });
    const idsAttendus = new Set(references.map((row) => row.contact_id));

    if (idsAttendus.size === 0) {
      return NextResponse.json({
        success: true,
        message: "Aucun contact rattaché à un contrat.",
        duree_ms: Date.now() - debut,
      });
    }

    // Apimo plafonne une requête à 10 000 éléments : sans pagination, les
    // contacts au-delà du plafond n'étaient jamais importés (14 583 au total),
    // laissant des contrats sans contact associé.
    const contactsApi = await fetchApimoAll<ContactApi>("contacts", "contacts");

    // 🔄 Convertir les champs anglais → français avant insertion
    const contactsCibles = contactsApi
      .map(mapApiContact)
      .filter((contact) => contact.id !== undefined && idsAttendus.has(contact.id));

    console.log(
      `📊 ${contactsApi.length} contacts Apimo → ${contactsCibles.length} rattachés à un contrat (${idsAttendus.size} attendus)`
    );

    // ---------------------------------------------------------------------
    // Préchargement + diff : une seule lecture, puis on n'écrit que le delta.
    // ---------------------------------------------------------------------
    const existants = await prisma.contacts.findMany({
      where: { contact_apimo_id: { in: [...idsAttendus] } },
      select: {
        contact_apimo_id: true,
        prenom: true,
        nom: true,
        email: true,
        mobile: true,
        adresse: true,
        ville: true,
        cp: true,
      },
    });
    const existantParApimo = new Map(
      existants.map((c) => [c.contact_apimo_id, c])
    );

    type Cible = {
      contactApimoId: number;
      prenom: string | null;
      nom: string | null;
      email: string | null;
      mobile: string | null;
      adresse: string | null;
      ville: string | null;
      cp: string | null;
    };
    const aCreer: Cible[] = [];
    const aMaj: Cible[] = [];

    for (const contact of contactsCibles) {
      const cible: Cible = {
        contactApimoId: contact.id as number,
        prenom: contact.prenom || null,
        nom: contact.nom || null,
        email: contact.email || null,
        mobile: contact.mobile || contact.phone || null,
        adresse: contact.adresse || null,
        ville: contact.ville?.name || null,
        cp: contact.ville?.zipcode || null,
      };

      const existant = existantParApimo.get(cible.contactApimoId);
      if (!existant) {
        aCreer.push(cible);
      } else if (
        !memeTexte(existant.prenom, cible.prenom) ||
        !memeTexte(existant.nom, cible.nom) ||
        !memeTexte(existant.email, cible.email) ||
        !memeTexte(existant.mobile, cible.mobile) ||
        !memeTexte(existant.adresse, cible.adresse) ||
        !memeTexte(existant.ville, cible.ville) ||
        !memeTexte(existant.cp, cible.cp)
      ) {
        aMaj.push(cible);
      }
    }

    let erreurs = 0;
    const ecrire = async ({ contactApimoId, ...donnees }: Cible) => {
      try {
        await prisma.contacts.upsert({
          where: { contact_apimo_id: contactApimoId },
          update: { ...donnees, updated_at: new Date() },
          create: { contact_apimo_id: contactApimoId, ...donnees },
        });
      } catch (error) {
        erreurs++;
        console.error(`❌ Contact ${contactApimoId} non enregistré :`, error);
      }
    };

    await runChunked(aCreer, ecrire);
    await runChunked(aMaj, ecrire);

    // Contacts référencés par un contrat mais introuvables côté Apimo :
    // utile à surveiller, c'est ce qui laisse un contrat sans nom de client.
    const idsTrouves = new Set(contactsCibles.map((c) => c.id));
    const introuvables = [...idsAttendus].filter((id) => !idsTrouves.has(id));
    if (introuvables.length > 0) {
      console.warn(
        `⚠️ ${introuvables.length} contact(s) référencés par un contrat sont absents d'Apimo :`,
        introuvables.slice(0, 20)
      );
    }

    const resume = {
      contacts_apimo: contactsApi.length,
      attendus: idsAttendus.size,
      crees: aCreer.length,
      mis_a_jour: aMaj.length,
      introuvables_apimo: introuvables.length,
      erreurs,
      duree_ms: Date.now() - debut,
    };
    console.log("✅ Sync contacts terminée", resume);

    return NextResponse.json({ success: true, ...resume });
  } catch (error) {
    console.error("Erreur lors de la récupération des contacts :", error);
    if (error instanceof ApimoError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}
