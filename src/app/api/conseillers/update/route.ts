import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function PUT(req: Request) {
  try {
    const data = await req.json();
    const { id, parrain_id, niveau2_id, niveau3_id, ...conseillerData } = data;

    if (!id) {
      return NextResponse.json(
        { error: "ID du conseiller manquant" },
        { status: 400 }
      );
    }

    // Mise à jour des informations du conseiller
    await prisma.utilisateurs.update({
      where: { id: Number(id) },
      data: conseillerData
    });

    // Gestion des parrainages
    const existingParrainage = await prisma.parrainages.findFirst({
      where: { user_id: Number(id) }
    });

    // Préparation des données de parrainage
    const parrainageData = {
      niveau1: parrain_id ? Number(parrain_id) : null,
      niveau2: niveau2_id ? Number(niveau2_id) : null,
      niveau3: niveau3_id ? Number(niveau3_id) : null
    };

    // Mise à jour ou création du parrainage
    if (existingParrainage) {
      await prisma.parrainages.update({
        where: { id: existingParrainage.id },
        data: parrainageData
      });
    } else if (parrain_id || niveau2_id || niveau3_id) {
      await prisma.parrainages.create({
        data: {
          user_id: Number(id),
          ...parrainageData
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Conseiller mis à jour avec succès" 
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du conseiller:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du conseiller" },
      { status: 500 }
    );
  }
}