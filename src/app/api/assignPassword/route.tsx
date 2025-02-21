import { NextResponse } from "next/server";
import { hashSync, genSaltSync } from "bcrypt-ts"; // Si tu utilises bcrypt pour hasher le mdp
import db from "@/lib/db"; // Assure-toi que c'est la bonne connexion à la base de données

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { conseillerId, password } = body;

    if (!conseillerId || !password) {
      return NextResponse.json(
        { error: "Tous les champs sont requis." },
        { status: 400 }
      );
    }

    // Hasher le mot de passe
    const salt = genSaltSync(10);
    const hashedPassword = hashSync(password.toString(), salt);

    // Mettre à jour l'utilisateur dans la base de données
    const result = await db.query(
      `UPDATE utilisateurs SET "motDePasse" = $1 WHERE idapimo = $2 RETURNING id`,
      [hashedPassword, conseillerId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Mot de passe attribué avec succès !" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de l'attribution du mot de passe :", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}
