import prisma from "@/lib/db";
import { calculRetrocession } from "./calculs";

/**
 * Récupère le CA de l'année en cours pour un utilisateur
 */
export async function getCACurrentYear(userId: number): Promise<number> {
  const currentYear = new Date().getFullYear();

  const historique = await prisma.historique_ca_annuel.findUnique({
    where: {
      user_id_annee: {
        user_id: userId,
        annee: currentYear
      }
    },
    select: {
      chiffre_affaires: true
    }
  });

  return historique ? Number(historique.chiffre_affaires) : 0;
}

/**
 * Met à jour le CA de l'année en cours pour un utilisateur
 * Synchronise automatiquement avec utilisateurs.chiffre_affaires
 */
export async function updateCACurrentYear(
  userId: number,
  montantToAdd: number,
  tx?: any
): Promise<{ newCA: number; newRetrocession: number }> {
  const prismaClient = tx || prisma;
  const currentYear = new Date().getFullYear();

  // Récupérer les infos utilisateur
  const user = await prismaClient.utilisateurs.findUnique({
    where: { id: userId },
    select: {
      typecontrat: true,
      auto_parrain: true
    }
  });

  if (!user) {
    throw new Error(`Utilisateur ${userId} non trouvé`);
  }

  // Upsert de l'historique année en cours
  const currentYearCA = await prismaClient.historique_ca_annuel.upsert({
    where: {
      user_id_annee: {
        user_id: userId,
        annee: currentYear
      }
    },
    update: {
      chiffre_affaires: {
        increment: montantToAdd
      },
      updated_at: new Date()
    },
    create: {
      user_id: userId,
      annee: currentYear,
      chiffre_affaires: montantToAdd,
      retrocession_finale: 0,
      typecontrat: user.typecontrat,
      auto_parrain: user.auto_parrain
    },
    select: {
      chiffre_affaires: true
    }
  });

  const newCA = Number(currentYearCA.chiffre_affaires);

  // Calculer la nouvelle rétrocession
  const newRetrocession = calculRetrocession(
    user.typecontrat || "",
    newCA,
    user.auto_parrain || undefined
  );

  // Mettre à jour la rétrocession dans l'historique
  await prismaClient.historique_ca_annuel.update({
    where: {
      user_id_annee: {
        user_id: userId,
        annee: currentYear
      }
    },
    data: {
      retrocession_finale: newRetrocession
    }
  });

  // Synchroniser avec utilisateurs (cache)
  await prismaClient.utilisateurs.update({
    where: { id: userId },
    data: {
      chiffre_affaires: newCA,
      retrocession: newRetrocession
    }
  });

  return { newCA, newRetrocession };
}
