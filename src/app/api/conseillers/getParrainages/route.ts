import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idConseiller = searchParams.get("idConseiller");

    if (!idConseiller) {
      return NextResponse.json(
        { error: "Le paramètre idConseiller est requis" },
        { status: 400 }
      );
    }

    const conseillerIdNumber = Number(idConseiller);

    // Récupérer le parrainage pour le conseiller
    const parrainage = await prisma.parrainages.findFirst({
      where: { user_id: conseillerIdNumber }
    });

    if (!parrainage) {
      return NextResponse.json({
        niveau1: { id: null, nom: "Aucun" },
        niveau2: { id: null, nom: "Aucun" },
        niveau3: { id: null, nom: "Aucun" }
      });
    }

    // Récupérer les informations de tous les parrains en une seule requête
    const parrainIds = [parrainage.niveau1, parrainage.niveau2, parrainage.niveau3].filter(id => id !== null) as number[];
    
    const parrains = parrainIds.length > 0 
      ? await prisma.utilisateurs.findMany({
          where: { id: { in: parrainIds } },
          select: { id: true, prenom: true, nom: true }
        })
      : [];

    // Construire la réponse
    const response = {
      niveau1: { 
        id: parrainage.niveau1, 
        nom: parrainage.niveau1 
          ? parrains.find(p => p.id === parrainage.niveau1)
            ? `${parrains.find(p => p.id === parrainage.niveau1)?.prenom} ${parrains.find(p => p.id === parrainage.niveau1)?.nom}`
            : "Aucun"
          : "Aucun"
      },
      niveau2: { 
        id: parrainage.niveau2, 
        nom: parrainage.niveau2 
          ? parrains.find(p => p.id === parrainage.niveau2)
            ? `${parrains.find(p => p.id === parrainage.niveau2)?.prenom} ${parrains.find(p => p.id === parrainage.niveau2)?.nom}`
            : "Aucun"
          : "Aucun"
      },
      niveau3: { 
        id: parrainage.niveau3, 
        nom: parrainage.niveau3 
          ? parrains.find(p => p.id === parrainage.niveau3)
            ? `${parrains.find(p => p.id === parrainage.niveau3)?.prenom} ${parrains.find(p => p.id === parrainage.niveau3)?.nom}`
            : "Aucun"
          : "Aucun"
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erreur lors de la récupération des parrainages:", error);
    return NextResponse.json(
      { 
        error: `Erreur lors de la récupération des parrainages: ${error instanceof Error ? error.message : String(error)}` 
      },
      { status: 500 }
    );
  }
} 