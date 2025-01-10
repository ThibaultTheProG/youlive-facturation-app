import { comparePassword, generateToken } from "@/lib/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    const client = await db.connect();

    try {
      const query = `
        SELECT id, "motDePasse", "role" FROM utilisateurs WHERE email = $1;
      `;
      const result = await client.query(query, [email]);

      if (result.rowCount === 0) {
        return NextResponse.json(
          { error: "Utilisateur non trouvé" },
          { status: 404 }
        );
      }

      const { id, motDePasse: hashedPassword, role } = result.rows[0];

      const isValid = await comparePassword(password, hashedPassword);

      if (!isValid) {
        return NextResponse.json(
          { error: "Mot de passe incorrect" },
          { status: 401 }
        );
      }

      // Générer un token JWT
      const token = await generateToken({ id, role });
     

      // Stocker le token dans un cookie sécurisé
      const response = NextResponse.json({
        message: "Connexion réussie",
        role,
      });

      response.cookies.set("authToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60, // 1 heure
      });

      return response;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Erreur serveur :", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}