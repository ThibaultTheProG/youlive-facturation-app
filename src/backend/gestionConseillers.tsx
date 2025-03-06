"use server";

import prisma from "../lib/db";
import { Conseiller } from "@/lib/types";

export async function getConseillersBDD(): Promise<Conseiller[]> {
  try {
    console.log("Début de getConseillersBDD");
    const conseillers = await prisma.utilisateurs.findMany();
    console.log("Données brutes de la BDD:", conseillers);

    if (!conseillers || conseillers.length === 0) {
      console.log("Aucun conseiller trouvé dans la BDD");
      return [];
    }

    const mappedConseillers = conseillers.map(c => ({
      ...c,
      siren: c.siren ? parseInt(c.siren) : undefined,
      chiffre_affaires: c.chiffre_affaires ? Number(c.chiffre_affaires) : 0,
      retrocession: c.retrocession ? Number(c.retrocession) : 0
    })) as unknown as Conseiller[];

    console.log("Conseillers après mapping:", mappedConseillers);
    return mappedConseillers;
  } catch (error) {
    console.error("Erreur détaillée lors de la récupération des conseillers:", error);
    console.error("Stack trace:", (error as Error).stack);
    return [];
  }
}

export async function getParrainLevel(idConseiller: number, niveau: number): Promise<{id: number | null, nom: string}> {
  try {
    const parrainage = await prisma.parrainages.findFirst({
      where: {
        user_id: idConseiller
      }
    });

    if (!parrainage) return { id: null, nom: "Aucun" };

    let parrainId: number | null = null;
    
    switch(niveau) {
      case 1:
        parrainId = parrainage.niveau1;
        break;
      case 2:
        parrainId = parrainage.niveau2;
        break;
      case 3:
        parrainId = parrainage.niveau3;
        break;
    }

    if (!parrainId) return { id: null, nom: "Aucun" };

    const parrain = await prisma.utilisateurs.findUnique({
      where: { id: parrainId }
    });

    return {
      id: parrainId,
      nom: parrain ? `${parrain.prenom} ${parrain.nom}` : "Aucun"
    };
  } catch (error) {
    console.error(`Impossible de récupérer le parrain de niveau ${niveau} :`, error);
    return { id: null, nom: "Aucun" };
  }
}
