import { NextResponse } from "next/server";
import prisma from "@/lib/db";

/**
 * GET /api/conseiller/annees?id=X
 * Retourne la liste des années disponibles pour un conseiller dans l'historique
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("id");

    if (!userId) {
      return NextResponse.json(
        { error: "ID de conseiller manquant" },
        { status: 400 }
      );
    }

    const id = Number(userId);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID de conseiller invalide" },
        { status: 400 }
      );
    }

    // Récupérer toutes les années disponibles pour ce conseiller
    const annees = await prisma.historique_ca_annuel.findMany({
      where: {
        user_id: id
      },
      select: {
        annee: true
      },
      orderBy: {
        annee: 'desc'
      },
      distinct: ['annee']
    });

    // Extraire uniquement les numéros d'année
    const anneesDisponibles = annees.map(h => h.annee);

    return NextResponse.json({
      success: true,
      annees: anneesDisponibles
    });

  } catch (error) {
    console.error("Erreur lors de la récupération des années:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
