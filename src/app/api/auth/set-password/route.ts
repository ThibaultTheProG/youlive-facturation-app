import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { hashPassword } from "@/lib/password";
import {
  LONGUEUR_MIN_MOT_DE_PASSE,
  MESSAGE_LONGUEUR_MIN,
} from "@/lib/passwordPolicy";
import { verifySetupToken } from "@/lib/passwordSetup";

export const runtime = "nodejs";

const MESSAGES = {
  invalide: "Ce lien n'est pas valide.",
  expire: "Ce lien a expiré. Demande une nouvelle invitation à Youlive.",
  deja_utilise:
    "Ce lien a déjà été utilisé. Connecte-toi avec ton mot de passe, ou demande une nouvelle invitation.",
} as const;

/**
 * POST /api/auth/set-password — route publique **par construction** : elle
 * n'est pas protégée par une session, c'est le jeton signé du corps de requête
 * qui fait office d'authentification (cf. `src/lib/passwordSetup.ts`).
 */
export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: MESSAGES.invalide }, { status: 400 });
    }

    if (
      !password ||
      typeof password !== "string" ||
      password.length < LONGUEUR_MIN_MOT_DE_PASSE
    ) {
      return NextResponse.json(
        { error: MESSAGE_LONGUEUR_MIN },
        { status: 400 }
      );
    }

    const resultat = await verifySetupToken(token);

    if ("erreur" in resultat) {
      return NextResponse.json(
        { error: MESSAGES[resultat.erreur] },
        { status: resultat.erreur === "invalide" ? 400 : 410 }
      );
    }

    await prisma.utilisateurs.update({
      where: { id: resultat.userId },
      data: { motDePasse: await hashPassword(password) },
    });

    return NextResponse.json({ message: "Mot de passe défini avec succès." });
  } catch (error) {
    console.error("Erreur lors de la définition du mot de passe :", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}

/** Permet à la page de vérifier la validité du lien avant d'afficher le formulaire. */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: MESSAGES.invalide }, { status: 400 });
  }

  const resultat = await verifySetupToken(token);

  if ("erreur" in resultat) {
    return NextResponse.json(
      { error: MESSAGES[resultat.erreur] },
      { status: resultat.erreur === "invalide" ? 400 : 410 }
    );
  }

  return NextResponse.json({ valide: true });
}
