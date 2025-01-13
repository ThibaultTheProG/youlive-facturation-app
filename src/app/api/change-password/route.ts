import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import db from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 6 caractères." },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

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

    const client = await db.connect();

    try {
      const query = `
        UPDATE utilisateurs
        SET "motDePasse" = $1
        WHERE id = $2;
      `;
      await client.query(query, [hashedPassword, user.id]);
    } finally {
      client.release();
    }

    return NextResponse.json({ message: "Mot de passe mis à jour avec succès." });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du mot de passe :", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}