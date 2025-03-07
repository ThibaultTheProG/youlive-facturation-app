import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/password";
import prisma from "@/lib/db"; // Assure-toi que c'est la bonne connexion à la base de données
import { Prisma } from "@prisma/client";

export const runtime = 'nodejs';

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

    // Convertir conseillerId en entier
    const conseillerIdInt = parseInt(conseillerId, 10);
    
    if (isNaN(conseillerIdInt)) {
      return NextResponse.json(
        { error: "L'ID du conseiller doit être un nombre valide." },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur existe
    const utilisateur = await prisma.utilisateurs.findUnique({
      where: {
        id: conseillerIdInt
      }
    });

    if (!utilisateur) {
      return NextResponse.json(
        { error: `Utilisateur avec l'ID ${conseillerIdInt} non trouvé.` },
        { status: 404 }
      );
    }

    // Hasher le mot de passe avec notre fonction auth.ts
    const hashedPassword = await hashPassword(password.toString());

    // Mettre à jour l'utilisateur avec Prisma
    await prisma.utilisateurs.update({
      where: {
        id: conseillerIdInt
      },
      data: {
        motDePasse: hashedPassword
      }
    });

    return NextResponse.json(
      { message: "Mot de passe attribué avec succès !" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de l'attribution du mot de passe :", error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json(
        { error: "Utilisateur non trouvé." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}
