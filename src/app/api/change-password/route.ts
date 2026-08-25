import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import {
  LONGUEUR_MIN_MOT_DE_PASSE,
  MESSAGE_LONGUEUR_MIN,
} from "@/lib/passwordPolicy";
import { cookies } from "next/headers";
import prisma from "@/lib/db";

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

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

    const cookieStore = await cookies();
    const token = cookieStore.get("authToken")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Utilisateur non authentifié." },
        { status: 401 }
      );
    }

    const user = await verifyToken(token);

    if (!user || !user.id) {
      return NextResponse.json(
        { error: "Utilisateur non valide." },
        { status: 401 }
      );
    }

    const hashedPassword = await hashPassword(password);

    await prisma.utilisateurs.update({
      where: {
        id: user.id
      },
      data: {
        motDePasse: hashedPassword
      }
    });

    return NextResponse.json({ message: "Mot de passe mis à jour avec succès." });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du mot de passe :", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}