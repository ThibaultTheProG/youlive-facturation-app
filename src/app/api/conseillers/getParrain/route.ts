import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idConseiller = searchParams.get("idConseiller");
    const niveau = searchParams.get("niveau");

    if (!idConseiller || !niveau) {
      return NextResponse.json(
        { error: "Les paramètres idConseiller et niveau sont requis" },
        { status: 400 }
      );
    }

    const conseillerIdNumber = Number(idConseiller);
    const niveauNumber = Number(niveau);

    if (isNaN(conseillerIdNumber) || isNaN(niveauNumber)) {
      return NextResponse.json(
        { error: "Les paramètres idConseiller et niveau doivent être des nombres valides" },
        { status: 400 }
      );
    }

    if (![1, 2, 3].includes(niveauNumber)) {
      return NextResponse.json(
        { error: "Niveau de parrainage invalide (doit être 1, 2 ou 3)" },
        { status: 400 }
      );
    }

    // Récupérer le parrainage pour le conseiller
    const parrainage = await prisma.parrainages.findFirst({
      where: { user_id: conseillerIdNumber }
    });

    if (!parrainage) {
      return NextResponse.json({ id: null, nom: "Aucun" });
    }

    // Déterminer l'ID du parrain en fonction du niveau
    let parrainId = null;
    switch (niveauNumber) {
      case 1:
        parrainId = parrainage.niveau1;
        break;
      case 2:
        parrainId = parrainage.niveau2;
        break;
      case 3:
        parrainId = parrainage.niveau3;
        break;
    }

    if (!parrainId) {
      return NextResponse.json({ id: null, nom: "Aucun" });
    }

    // Récupérer les informations du parrain
    const parrain = await prisma.utilisateurs.findUnique({
      where: { id: parrainId },
      select: { id: true, prenom: true, nom: true }
    });

    if (!parrain) {
      console.warn(`Parrain avec ID ${parrainId} non trouvé dans la base de données`);
      return NextResponse.json({ id: parrainId, nom: "Conseiller inconnu" });
    }

    return NextResponse.json({
      id: parrainId,
      nom: `${parrain.prenom} ${parrain.nom}`
    });
  } catch (error) {
    console.error("Erreur lors de la récupération du parrain:", error);
    return NextResponse.json(
      { 
        error: `Erreur lors de la récupération du parrain: ${error instanceof Error ? error.message : String(error)}` 
      },
      { status: 500 }
    );
  }
}
