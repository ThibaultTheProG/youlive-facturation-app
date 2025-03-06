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