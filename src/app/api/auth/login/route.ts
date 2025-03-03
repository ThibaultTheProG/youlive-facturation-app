import { comparePassword, generateToken } from "@/lib/auth";
import prisma from "@/lib/db";
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

    // Rechercher l'utilisateur avec Prisma
    const user = await prisma.utilisateurs.findFirst({
      where: { 
        email,
        motDePasse: { not: null },
        role: { not: null }
      },
      select: {
        id: true,
        motDePasse: true,
        role: true,
        nom: true,
        prenom: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    const { id, motDePasse: hashedPassword, role } = user;
    const name = `${user.prenom} ${user.nom}`.trim();

    const isValid = await comparePassword(password, hashedPassword as string);

    if (!isValid) {
      return NextResponse.json(
        { error: "Mot de passe incorrect" },
        { status: 401 }
      );
    }

    // Générer un token JWT
    const token = await generateToken({ id, role: role as "admin" | "conseiller", name, email });
   

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
  } catch (error) {
    console.error("Erreur serveur :", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}