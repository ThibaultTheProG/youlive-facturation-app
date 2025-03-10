import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const factures = await prisma.factures.findMany({
      select: {
        id: true,
        user_id: true,
        type: true,
        retrocession: true,
        statut_paiement: true,
        created_at: true,
        numero: true,
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Récupérer les informations des utilisateurs
    const facturesWithUsers = await Promise.all(
      factures.map(async (facture) => {
        const user = await prisma.utilisateurs.findUnique({
          where: { id: facture.user_id || undefined },
          select: { prenom: true, nom: true }
        });
        return {
          ...facture,
          conseiller: user ? {
            prenom: user.prenom,
            nom: user.nom
          } : null
        };
      })
    );

    return NextResponse.json(facturesWithUsers, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la récupération des factures :", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}
