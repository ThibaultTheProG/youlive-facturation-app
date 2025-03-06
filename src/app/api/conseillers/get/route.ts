import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const conseillers = await prisma.utilisateurs.findMany({
      where: {
        role: "conseiller",
      },
      select: {
        id: true,
        idapimo: true,
        prenom: true,
        nom: true,
        email: true,
        telephone: true,
        adresse: true,
        siren: true,
        tva: true,
        chiffre_affaires: true,
        role: true,
      },
      orderBy: {
        nom: "asc",
      },
    });

    return NextResponse.json(conseillers, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la récupération des conseillers :", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
