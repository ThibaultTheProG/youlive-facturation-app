import prisma from "@/lib/db";
import { calculRetrocession } from "./calculs";
import { round2 } from "./decoupageSeuil";

/**
 * Récupère le CA de l'année en cours pour un utilisateur
 */
export async function getCACurrentYear(userId: number): Promise<number> {
  const currentYear = new Date().getFullYear();
  return getCAForYear(userId, currentYear);
}

/**
 * Récupère le CA d'une année donnée pour un utilisateur
 */
export async function getCAForYear(userId: number, year: number): Promise<number> {
  const historique = await prisma.historique_ca_annuel.findUnique({
    where: {
      user_id_annee: {
        user_id: userId,
        annee: year
      }
    },
    select: {
      chiffre_affaires: true
    }
  });

  return historique ? Number(historique.chiffre_affaires) : 0;
}

/**
 * Récupère les données historiques d'une année donnée pour un utilisateur
 * (typecontrat, auto_parrain, retrocession_finale, chiffre_affaires)
 * Utile pour générer des factures sur des contrats d'années précédentes
 */
export async function getHistoriqueForYear(userId: number, year: number) {
  const historique = await prisma.historique_ca_annuel.findUnique({
    where: {
      user_id_annee: {
        user_id: userId,
        annee: year
      }
    },
    select: {
      chiffre_affaires: true,
      retrocession_finale: true,
      typecontrat: true,
      auto_parrain: true
    }
  });

  return historique;
}

/**
 * Recalcule (idempotent) le CA d'une année pour un utilisateur en fixant
 * directement le total (SET) au lieu de l'incrémenter.
 *
 * `totalHonoraires` doit être la SOMME des honoraires_agent de toutes les
 * relations type 9 du conseiller pour l'année considérée (source de vérité Apimo).
 * Recalcule la rétrocession finale et synchronise le cache `utilisateurs`
 * uniquement pour l'année en cours.
 *
 * Une année déjà clôturée (date_cloture renseignée) n'est jamais réécrite.
 * Retourne null si l'année est clôturée (recalcul ignoré).
 */
export async function recomputeCAForYear(
  userId: number,
  year: number,
  totalHonoraires: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx?: any
): Promise<{ newCA: number; newRetrocession: number } | null> {
  const prismaClient = tx || prisma;
  const currentYear = new Date().getFullYear();

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

  // Ne pas réécrire une année déjà clôturée (figée par le reset annuel)
  const existing = await prismaClient.historique_ca_annuel.findUnique({
    where: { user_id_annee: { user_id: userId, annee: year } },
    select: { date_cloture: true }
  });

  if (existing?.date_cloture) {
    return null;
  }

  // Arrondi à 2 décimales AVANT toute comparaison au seuil (artefacts flottants
  // type 103999.98000000001 accumulés en sommant les honoraires).
  const totalCA = round2(totalHonoraires);

  const newRetrocession = calculRetrocession(
    user.typecontrat || "",
    totalCA,
    user.auto_parrain || undefined
  );

  await prismaClient.historique_ca_annuel.upsert({
    where: { user_id_annee: { user_id: userId, annee: year } },
    update: {
      chiffre_affaires: totalCA,
      retrocession_finale: newRetrocession,
      updated_at: new Date()
    },
    create: {
      user_id: userId,
      annee: year,
      chiffre_affaires: totalCA,
      retrocession_finale: newRetrocession,
      typecontrat: user.typecontrat,
      auto_parrain: user.auto_parrain
    }
  });

  // Synchroniser le cache utilisateurs uniquement pour l'année en cours
  if (year === currentYear) {
    await prismaClient.utilisateurs.update({
      where: { id: userId },
      data: {
        chiffre_affaires: totalCA,
        retrocession: newRetrocession
      }
    });
  }

  return { newCA: totalCA, newRetrocession };
}
