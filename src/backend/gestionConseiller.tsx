"use server";

import prisma from "../lib/db";
import { Conseiller } from "@/lib/types";

export default async function getConseillerBDD(user: {
  id: number;
}): Promise<Conseiller | undefined> {
  try {
    const conseiller = await prisma.utilisateurs.findUnique({
      where: {
        id: user.id
      }
    });

    if (!conseiller) return undefined;

    return {
      ...conseiller,
      siren: conseiller.siren ? parseInt(conseiller.siren) : undefined,
      chiffre_affaires: conseiller.chiffre_affaires ? Number(conseiller.chiffre_affaires) : 0,
      retrocession: conseiller.retrocession ? Number(conseiller.retrocession) : 0
    } as Conseiller;
  } catch (error) {
    console.error(
      "Impossible de récupérer le conseiller depuis la BDD :",
      error
    );
    return undefined;
  }
}