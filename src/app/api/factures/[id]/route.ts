import { NextResponse } from "next/server";
import { getFactureById } from "@/backend/gestionFactures";
import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    // Récupérer l'URL actuelle et extraire l'ID à partir de `searchParams`
    const url = new URL(request.url);
    const factureIdParam = url.pathname.split("/").pop(); // Récupérer l'ID depuis l'URL

    if (!factureIdParam) {
      return NextResponse.json(
        { error: "ID de facture manquant" },
        { status: 400 }
      );
    }

    const factureId = Number(factureIdParam);

    if (isNaN(factureId)) {
      return NextResponse.json(
        { error: "ID de facture invalide" },
        { status: 400 }
      );
    }

    const facture = await getFactureById(factureId);

    if (!facture) {
      return NextResponse.json(
        { error: "Facture introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json(facture);
  } catch (error) {
    console.error("Erreur lors de la récupération de la facture :", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const url = new URL(request.url);
    const factureIdParam = url.pathname.split("/").pop();

    if (!factureIdParam) {
      return NextResponse.json(
        { error: "ID de facture manquant" },
        { status: 400 }
      );
    }

    const factureId = Number(factureIdParam);

    if (isNaN(factureId)) {
      return NextResponse.json(
        { error: "ID de facture invalide" },
        { status: 400 }
      );
    }

    const { statut_paiement, numero, created_at, apporteur, apporteur_amount } =
      await request.json();

    // Vérifier les données à mettre à jour
    if (!numero && !created_at) {
      console.error("Aucune donnée à mettre à jour");
      return NextResponse.json(
        { error: "Aucune donnée à mettre à jour" },
        { status: 400 }
      );
    }

    // Construire l'objet de mise à jour pour Prisma
    const updateData: Prisma.facturesUpdateInput = {
      updated_at: new Date(),
    };

    if (statut_paiement) updateData.statut_paiement = statut_paiement;
    if (numero) updateData.numero = numero;
    if (created_at) updateData.created_at = new Date(created_at);
    if (apporteur) updateData.apporteur = apporteur;
    if (apporteur_amount) updateData.apporteur_amount = apporteur_amount;

    const result = await prisma.factures.update({
      where: {
        id: factureId,
      },
      data: updateData,
      select: {
        id: true,
        statut_paiement: true,
        numero: true,
        created_at: true,
      },
    });

    return NextResponse.json(
      {
        message: "Mise à jour effectuée avec succès",
        updatedData: result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la facture :", error);
    
    // Gestion spécifique de l'erreur Prisma pour facture non trouvée
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json(
        { error: "Facture introuvable ou non mise à jour" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
