import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(req: Request) {
  try {
    // Récupérer l'ID du conseiller et l'année depuis l'URL
    const url = new URL(req.url);
    const conseillerId = Number(url.searchParams.get("conseillerId"));
    const anneeParam = url.searchParams.get("annee");

    // Vérifier si conseillerId est un nombre valide
    if (isNaN(conseillerId) || conseillerId <= 0) {
      return NextResponse.json(
        { error: "ID du conseiller invalide" },
        { status: 400 }
      );
    }

    // Déterminer l'année à consulter (par défaut: année en cours)
    const annee = anneeParam ? Number(anneeParam) : new Date().getFullYear();

    // Récupérer tous les parrainages où le conseiller apparaît
    const parrainages = await prisma.parrainages.findMany({
      where: {
        OR: [
          { niveau1: { in: [conseillerId] } },
          { niveau2: { in: [conseillerId] } },
          { niveau3: { in: [conseillerId] } }
        ]
      },
      select: {
        niveau1: true,
        niveau2: true,
        niveau3: true,
        user: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            chiffre_affaires: true, // Pour l'année en cours
            historique_ca_annuel: {
              where: { annee: annee },
              select: {
                chiffre_affaires: true
              }
            }
          }
        }
      }
    });

    // Transformer les résultats en déterminant le niveau pour chaque filleul
    const filleulsFormattes = parrainages.map(parrainage => {
      let niveau = "";
      if (parrainage.niveau1 === conseillerId) niveau = "Niveau 1";
      else if (parrainage.niveau2 === conseillerId) niveau = "Niveau 2";
      else if (parrainage.niveau3 === conseillerId) niveau = "Niveau 3";

      // Déterminer le CA à afficher selon l'année
      let chiffre_affaires = 0;
      const currentYear = new Date().getFullYear();

      if (annee === currentYear && !anneeParam) {
        // Année en cours sans paramètre: utiliser le champ utilisateurs
        chiffre_affaires = Number(parrainage.user.chiffre_affaires || 0);
      } else if (parrainage.user.historique_ca_annuel.length > 0) {
        // Année spécifique: utiliser l'historique
        chiffre_affaires = Number(parrainage.user.historique_ca_annuel[0].chiffre_affaires || 0);
      }

      return {
        id: parrainage.user.id,
        prenom: parrainage.user.prenom,
        nom: parrainage.user.nom,
        chiffre_affaires: chiffre_affaires,
        niveau: niveau
      };
    });

    return NextResponse.json(filleulsFormattes, { status: 200 });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des filleuls :", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}
