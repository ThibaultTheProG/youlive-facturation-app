import { NextResponse } from "next/server";
import { getFactureById } from "@/backend/gestionFactures";
import db from "@/lib/db";

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

    // Construire dynamiquement la requête SQL en fonction des champs fournis
    const fieldsToUpdate: string[] = ["updated_at = NOW()"];
    const params: Array<string | number> = [];

    if (statut_paiement) {
      fieldsToUpdate.push(`statut_paiement = $${params.length + 1}`);
      params.push(statut_paiement);
    }

    if (numero) {
      fieldsToUpdate.push(`numero = $${params.length + 1}`);
      params.push(numero);
    }

    if (created_at) {
      fieldsToUpdate.push(
        `created_at = $${params.length + 1} AT TIME ZONE 'Europe/Paris'`
      );
      params.push(new Date(created_at).toISOString());
    }

    if (apporteur) {
      fieldsToUpdate.push(`apporteur = $${params.length + 1}`);
      params.push(apporteur);
    }

    if (apporteur_amount) {
      fieldsToUpdate.push(`apporteur_amount = $${params.length + 1}`);
      params.push(apporteur_amount);
    }

    // Ajouter l'ID de la facture pour la clause WHERE
    params.push(factureId);

    const query = `
  UPDATE factures 
  SET ${fieldsToUpdate.join(", ")}
  WHERE id = $${params.length}
  RETURNING id, statut_paiement, numero, created_at; 
`;

    const result = await db.query(query, params);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Facture introuvable ou non mise à jour" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: "Mise à jour effectuée avec succès",
        updatedData: result.rows[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la facture :", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
