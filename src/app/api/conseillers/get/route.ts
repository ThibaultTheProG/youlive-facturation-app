import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const anneeParam = searchParams.get("annee");
    const annee = anneeParam ? Number(anneeParam) : new Date().getFullYear();
    const currentYear = new Date().getFullYear();

    console.log(`📊 Récupération conseillers pour l'année ${annee}${anneeParam ? ' (spécifique)' : ' (en cours)'}`);

    const conseillers = await prisma.utilisateurs.findMany({
      where: {
        role: "conseiller",
      },
      select: {
        id: true,
        idapimo: true,
        prenom: true,
        nom: true,
        email: true,
        telephone: true,
        mobile: true,
        adresse: true,
        siren: true,
        tva: true,
        chiffre_affaires: true,
        retrocession: true,
        auto_parrain: true,
        typecontrat: true,
        role: true,
        // Informations facture de recrutement
        nom_societe_facture: true,
        siren_facture: true,
        adresse_facture: true,
        // Historique CA annuel
        historique_ca_annuel: {
          where: {
            annee: annee
          },
          select: {
            chiffre_affaires: true,
            retrocession_finale: true
          }
        }
      },
      orderBy: {
        nom: "asc",
      },
    });

    // Convertir les types et gérer le CA/rétrocession selon l'année
    const mappedConseillers = conseillers.map(c => {
      let chiffre_affaires = 0;
      let retrocession = 0;

      // Si c'est l'année en cours et aucun paramètre année spécifié, utiliser les champs directs
      // (synchronisés avec l'année en cours par updateCACurrentYear)
      if (annee === currentYear && !anneeParam) {
        chiffre_affaires = c.chiffre_affaires ? Number(c.chiffre_affaires) : 0;
        retrocession = c.retrocession ? Number(c.retrocession) : 0;
      }
      // Pour une année spécifique ou si les champs directs sont vides, utiliser l'historique
      else if (c.historique_ca_annuel.length > 0) {
        chiffre_affaires = Number(c.historique_ca_annuel[0].chiffre_affaires || 0);
        retrocession = Number(c.historique_ca_annuel[0].retrocession_finale || 0);
      }
      // Fallback: si pas d'historique et pas de CA direct, laisser à 0

      return {
        ...c,
        siren: c.siren ? c.siren : undefined,
        chiffre_affaires,
        retrocession,
        historique_ca_annuel: undefined // Retirer de la réponse finale
      };
    });

    console.log(`✅ ${mappedConseillers.length} conseillers récupérés`);
    return NextResponse.json(mappedConseillers, { status: 200 });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des conseillers :", error);
    // Retourner plus de détails sur l'erreur pour le débogage
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json(
      {
        error: "Erreur interne du serveur",
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
