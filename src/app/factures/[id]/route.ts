import { NextResponse } from "next/server";
import { getFactureById } from "@/backend/gestionFactures";

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