import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { Conseiller } from "@/lib/types";

export async function GET(request: Request) {
  try {
    // Récupérer l'ID du conseiller depuis les paramètres de requête

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

    // Récupérer le conseiller depuis la base de données
    const conseiller = await prisma.utilisateurs.findUnique({
      where: {
        id: id,
      },
    });

    if (!conseiller) {
      return NextResponse.json(
        { error: "Conseiller introuvable" },
        { status: 404 }
      );
    }

    // Transformer les données pour le format Conseiller
    const conseillerData: Conseiller = {
      id: conseiller.id,
      prenom: conseiller.prenom || "",
      nom: conseiller.nom || "",
      email: conseiller.email || "",
      telephone: conseiller.telephone || "",
      mobile: conseiller.mobile || "",
      adresse: conseiller.adresse || "",
      autre_adresse: conseiller.autre_adresse || "",
      utilise_autre_adresse: conseiller.utilise_autre_adresse || false,
      idapimo: conseiller.idapimo || 0,
      tva: conseiller.tva || false,
      typecontrat: conseiller.typecontrat || "",
      siren: conseiller.siren ? parseInt(conseiller.siren) : undefined,
      chiffre_affaires: conseiller.chiffre_affaires
        ? Number(conseiller.chiffre_affaires)
        : 0,
      retrocession: conseiller.retrocession
        ? Number(conseiller.retrocession)
        : 0,
      auto_parrain: conseiller.auto_parrain || "",
      parrain_id: undefined,
      niveau: "",
    };

    return NextResponse.json(conseillerData);
  } catch (error) {
    console.error(
      "Impossible de récupérer les informations du conseiller :",
      error
    );
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
