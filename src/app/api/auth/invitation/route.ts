import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/apiAuth";
import { createSetupToken } from "@/lib/passwordSetup";
import { sendInvitationEmail } from "@/lib/email";

export const runtime = "nodejs";

/**
 * POST /api/auth/invitation — remplace l'ancien `POST /api/assignPassword`.
 *
 * L'admin ne choisit plus le mot de passe : la route envoie au conseiller un
 * lien signé valable 48h vers `/definir-mot-de-passe`, où il définit lui-même
 * son mot de passe. Aucun secret ne transite par email.
 */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const { conseillerId } = await request.json();

    const id = parseInt(conseillerId, 10);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "L'ID du conseiller doit être un nombre valide." },
        { status: 400 }
      );
    }

    const utilisateur = await prisma.utilisateurs.findUnique({
      where: { id },
      select: { email: true, prenom: true, nom: true, motDePasse: true },
    });

    if (!utilisateur) {
      return NextResponse.json(
        { error: `Utilisateur avec l'ID ${id} non trouvé.` },
        { status: 404 }
      );
    }

    if (!utilisateur.email) {
      return NextResponse.json(
        { error: "L'utilisateur n'a pas d'adresse email configurée." },
        { status: 400 }
      );
    }

    if (!utilisateur.prenom || !utilisateur.nom) {
      return NextResponse.json(
        { error: "Les informations de l'utilisateur sont incomplètes." },
        { status: 400 }
      );
    }

    const token = await createSetupToken(id, utilisateur.motDePasse);
    const lien = `${process.env.NEXT_PUBLIC_BASE_URL}/definir-mot-de-passe?token=${encodeURIComponent(token)}`;

    const envoye = await sendInvitationEmail(
      utilisateur.email,
      lien,
      utilisateur.prenom,
      utilisateur.nom
    );

    if (!envoye) {
      return NextResponse.json(
        { error: "Erreur lors de l'envoi de l'email." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: `Invitation envoyée à ${utilisateur.email}.` },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'invitation :", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}
