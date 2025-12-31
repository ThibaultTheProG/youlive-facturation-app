import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { Conseiller } from "@/lib/types";

export async function GET(request: Request) {
  try {
    // Récupérer l'ID du conseiller et l'année depuis les paramètres de requête
    const url = new URL(request.url);
    const userId = url.searchParams.get("id");
    const anneeParam = url.searchParams.get("annee");

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

    // Déterminer l'année à consulter (par défaut: année en cours)
    const annee = anneeParam ? Number(anneeParam) : new Date().getFullYear();

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

    // Récupérer le CA et la rétrocession de l'année demandée
    let chiffre_affaires = 0;
    let retrocession = 0;

    if (anneeParam) {
      // Si une année spécifique est demandée, chercher dans l'historique
      const historique = await prisma.historique_ca_annuel.findUnique({
        where: {
          user_id_annee: {
            user_id: id,
            annee: annee
          }
        },
        select: {
          chiffre_affaires: true,
          retrocession_finale: true
        }
      });

      if (historique) {
        chiffre_affaires = Number(historique.chiffre_affaires);
        retrocession = Number(historique.retrocession_finale);
      }
    } else {
      // Année en cours: utiliser le champ de la table utilisateurs (synchronisé)
      chiffre_affaires = conseiller.chiffre_affaires ? Number(conseiller.chiffre_affaires) : 0;
      retrocession = conseiller.retrocession ? Number(conseiller.retrocession) : 0;
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
      idapimo: conseiller.idapimo || 0,
      tva: conseiller.tva || false,
      typecontrat: conseiller.typecontrat || "",
      siren: conseiller.siren ? parseInt(conseiller.siren) : undefined,
      chiffre_affaires: chiffre_affaires, // Utilise le CA de l'année demandée
      retrocession: retrocession, // Utilise la rétrocession de l'année demandée
      auto_parrain: conseiller.auto_parrain || "",
      parrain_id: undefined,
      niveau: "",
      // Informations facture de recrutement
      nom_societe_facture: conseiller.nom_societe_facture || "",
      siren_facture: conseiller.siren_facture || "",
      adresse_facture: conseiller.adresse_facture || "",
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
