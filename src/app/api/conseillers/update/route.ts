import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function PUT(req: Request) {
  try {
    const data = await req.json();
    const { id, parrain_id, niveau2_id, niveau3_id, ...conseillerData } = data;

    // Ajout de logs pour déboguer
    console.log("Données reçues:", {
      id,
      parrain_id,
      niveau2_id,
      niveau3_id,
      ...conseillerData
    });

    if (!id) {
      return NextResponse.json(
        { error: "ID du conseiller manquant" },
        { status: 400 }
      );
    }

    // Mise à jour des informations du conseiller
    try {
      await prisma.utilisateurs.update({
        where: { id: Number(id) },
        data: conseillerData
      });
      console.log("Mise à jour utilisateur réussie");
    } catch (updateError) {
      console.error("Erreur lors de la mise à jour de l'utilisateur:", updateError);
      return NextResponse.json(
        { error: `Erreur lors de la mise à jour de l'utilisateur: ${updateError instanceof Error ? updateError.message : String(updateError)}` },
        { status: 500 }
      );
    }

    // Gestion des parrainages
    try {
      const existingParrainage = await prisma.parrainages.findFirst({
        where: { user_id: Number(id) }
      });
      console.log("Parrainage existant:", existingParrainage);

      // Préparation des données de parrainage avec vérification des valeurs
      const parrainageData = {
        niveau1: parrain_id ? Number(parrain_id) : null,
        niveau2: niveau2_id ? Number(niveau2_id) : null,
        niveau3: niveau3_id ? Number(niveau3_id) : null
      };
      
      console.log("Données de parrainage à enregistrer:", parrainageData);

      // Mise à jour ou création du parrainage
      if (existingParrainage) {
        await prisma.parrainages.update({
          where: { id: existingParrainage.id },
          data: parrainageData
        });
        console.log("Mise à jour parrainage réussie");
      } else if (parrain_id || niveau2_id || niveau3_id) {
        await prisma.parrainages.create({
          data: {
            user_id: Number(id),
            ...parrainageData
          }
        });
        console.log("Création parrainage réussie");
      }
    } catch (parrainageError) {
      console.error("Erreur lors de la gestion des parrainages:", parrainageError);
      return NextResponse.json(
        { error: `Erreur lors de la gestion des parrainages: ${parrainageError instanceof Error ? parrainageError.message : String(parrainageError)}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: "Conseiller mis à jour avec succès" 
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du conseiller:", error);
    return NextResponse.json(
      { error: `Erreur lors de la mise à jour du conseiller: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}