import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "ID du conseiller manquant" },
        { status: 400 }
      );
    }

    const conseillerId = Number(id);

    // Vérifier que le conseiller existe
    const conseiller = await prisma.utilisateurs.findUnique({
      where: { id: conseillerId },
    });

    if (!conseiller) {
      return NextResponse.json(
        { error: "Conseiller introuvable" },
        { status: 404 }
      );
    }

    // 1. Désactiver le conseiller
    await prisma.utilisateurs.update({
      where: { id: conseillerId },
      data: { actif: false },
    });

    // 2. Retirer le conseiller désactivé des parrainages (sans décalage de niveaux)
    await prisma.parrainages.updateMany({
      where: { niveau1: conseillerId },
      data: { niveau1: null },
    });
    await prisma.parrainages.updateMany({
      where: { niveau2: conseillerId },
      data: { niveau2: null },
    });
    await prisma.parrainages.updateMany({
      where: { niveau3: conseillerId },
      data: { niveau3: null },
    });

    // 3. Supprimer le propre enregistrement de parrainage du conseiller désactivé
    await prisma.parrainages.deleteMany({
      where: { user_id: conseillerId },
    });

    console.log(`✅ Conseiller ${conseillerId} (${conseiller.prenom} ${conseiller.nom}) désactivé`);

    return NextResponse.json({
      success: true,
      message: `Conseiller ${conseiller.prenom} ${conseiller.nom} désactivé avec succès`,
    });
  } catch (error) {
    console.error("Erreur lors de la désactivation du conseiller:", error);
    return NextResponse.json(
      {
        error: `Erreur lors de la désactivation: ${
          error instanceof Error ? error.message : String(error)
        }`,
      },
      { status: 500 }
    );
  }
}
