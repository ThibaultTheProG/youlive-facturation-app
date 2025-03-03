import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(req: Request) {
  try {
    // Récupérer l'ID du conseiller depuis l'URL
    const url = new URL(req.url);
    const conseillerId = Number(url.searchParams.get("conseillerId"));

    // Vérifier si conseillerId est un nombre valide
    if (isNaN(conseillerId) || conseillerId <= 0) {
      return NextResponse.json(
        { error: "ID du conseiller invalide" },
        { status: 400 }
      );
    }

    // Récupérer tous les parrainages où le conseiller apparaît
    const parrainages = await prisma.parrainages.findMany({
      where: {
        OR: [
          { niveau1: { in: [conseillerId] } },
          { niveau2: { in: [conseillerId] } },
          { niveau3: { in: [conseillerId] } }
        ]
      },
      select: {
        niveau1: true,
        niveau2: true,
        niveau3: true,
        user: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            chiffre_affaires: true
          }
        }
      }
    });

    // Transformer les résultats en déterminant le niveau pour chaque filleul
    const filleulsFormattes = parrainages.map(parrainage => {
      let niveau = "";
      if (parrainage.niveau1 === conseillerId) niveau = "Niveau 1";
      else if (parrainage.niveau2 === conseillerId) niveau = "Niveau 2";
      else if (parrainage.niveau3 === conseillerId) niveau = "Niveau 3";

      return {
        id: parrainage.user.id,
        prenom: parrainage.user.prenom,
        nom: parrainage.user.nom,
        chiffre_affaires: Number(parrainage.user.chiffre_affaires || 0),
        niveau: niveau
      };
    });

    // 🔍 Debugging pour voir les résultats en console
    console.log(
      `✅ Filleuls trouvés pour le conseiller ${conseillerId} :`,
      filleulsFormattes
    );

    return NextResponse.json(filleulsFormattes, { status: 200 });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des filleuls :", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}
