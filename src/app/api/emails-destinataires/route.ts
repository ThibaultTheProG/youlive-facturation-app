import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/apiAuth";
import {
  adressesParDefaut,
  invalider,
  lireTout,
} from "@/lib/emailsConfiguration";
import {
  EVENEMENTS_EMAIL,
  definitionEvenement,
  normaliserAdresse,
  type EmailsConfigurationReponse,
  type ModeDestinataire,
} from "@/lib/emailsEvenements";

export const dynamic = "force-dynamic";

/** Adresses enregistrées, et celles en vigueur faute d'enregistrement. */
export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    invalider();
    const destinataires = await lireTout();

    const parDefaut: EmailsConfigurationReponse["parDefaut"] = {};
    for (const { evenement, modes } of EVENEMENTS_EMAIL) {
      for (const mode of modes) {
        const vide = !destinataires.some(
          (d) => d.evenement === evenement && d.mode === mode
        );
        const repli = vide ? adressesParDefaut(evenement, mode) : null;
        if (repli) parDefaut[`${evenement}:${mode}`] = repli;
      }
    }

    const corps: EmailsConfigurationReponse = { destinataires, parDefaut };
    return NextResponse.json(corps);
  } catch (error) {
    console.error("Erreur lecture des destinataires d'email :", error);
    return NextResponse.json({ error: "Erreur interne du serveur." }, { status: 500 });
  }
}

/** Ajoute une adresse à un email. */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const corps = await request.json().catch(() => null);
  const definition = definitionEvenement(corps?.evenement);
  const mode = corps?.mode as ModeDestinataire;
  const adresse = normaliserAdresse(corps?.adresse);

  if (!definition || !definition.modes.includes(mode)) {
    return NextResponse.json({ error: "Email ou type de destinataire inconnu." }, { status: 400 });
  }
  if (!adresse) {
    return NextResponse.json({ error: "Cette adresse email n'est pas valide." }, { status: 400 });
  }

  try {
    const ligne = await prisma.emails_destinataires.create({
      data: { evenement: definition.evenement, mode, adresse },
      select: { id: true, evenement: true, mode: true, adresse: true },
    });
    invalider();
    return NextResponse.json(ligne, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Cette adresse est déjà dans la liste." }, { status: 409 });
    }
    console.error("Erreur ajout d'un destinataire d'email :", error);
    return NextResponse.json({ error: "Erreur interne du serveur." }, { status: 500 });
  }
}
