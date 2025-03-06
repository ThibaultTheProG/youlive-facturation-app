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
        retrocession: true,
        auto_parrain: true,
        typecontrat: true,
        role: true,
      },
      orderBy: {
        nom: "asc",
      },
    });

    // Convertir les types pour correspondre à ce que retournait getConseillersBDD
    const mappedConseillers = conseillers.map(c => ({
      ...c,
      siren: c.siren ? c.siren : undefined,
      chiffre_affaires: c.chiffre_affaires ? Number(c.chiffre_affaires) : 0,
      retrocession: c.retrocession ? Number(c.retrocession) : 0
    }));

    return NextResponse.json(mappedConseillers, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la récupération des conseillers :", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
