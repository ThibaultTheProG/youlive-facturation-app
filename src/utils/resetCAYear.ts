import prisma from "@/lib/db";
import { calculRetrocession } from "./calculs";
import { SOURCES_UTILISATEUR } from "./utilisateursHistorique";

/**
 * Vérifie si une réinitialisation annuelle est nécessaire
 * Appelé au début de l'import des contrats
 */
export async function checkAndResetYearIfNeeded(): Promise<boolean> {
  const currentYear = new Date().getFullYear();

  // Vérifier si un historique non clôturé existe pour l'année en cours
  const existingCurrentYear = await prisma.historique_ca_annuel.findFirst({
    where: {
      annee: currentYear,
      date_cloture: null
    }
  });

  // Si existe, pas de reset nécessaire
  if (existingCurrentYear) {
    return false;
  }

  console.log(`🔄 Réinitialisation annuelle détectée pour ${currentYear}`);

  try {
    await prisma.$transaction(async (tx) => {
      const previousYear = currentYear - 1;

      // 1. Clôturer l'année précédente
      const previousYearRecords = await tx.historique_ca_annuel.findMany({
        where: {
          annee: previousYear,
          date_cloture: null
        }
      });

      if (previousYearRecords.length > 0) {
        console.log(`📦 Clôture de ${previousYearRecords.length} enregistrements ${previousYear}`);

        await tx.historique_ca_annuel.updateMany({
          where: {
            annee: previousYear,
            date_cloture: null
          },
          data: {
            date_cloture: new Date(`${currentYear}-01-01T00:00:00Z`)
          }
        });
      }

      // 2. Créer des enregistrements vides pour la nouvelle année
      const usersWithHistory = await tx.historique_ca_annuel.findMany({
        where: { annee: previousYear },
        distinct: ['user_id'],
        select: {
          user_id: true,
          utilisateurs: {
            select: {
              typecontrat: true,
              auto_parrain: true
            }
          }
        }
      });

      console.log(`📊 Création de ${usersWithHistory.length} enregistrements ${currentYear}`);

      for (const userHistory of usersWithHistory) {
        await tx.historique_ca_annuel.create({
          data: {
            user_id: userHistory.user_id,
            annee: currentYear,
            chiffre_affaires: 0,
            retrocession_finale: 0,
            typecontrat: userHistory.utilisateurs.typecontrat,
            auto_parrain: userHistory.utilisateurs.auto_parrain,
            date_cloture: null
          }
        });
      }

      // Signature des écritures sur `utilisateurs` pour `utilisateurs_historique`
      await tx.$queryRaw`SELECT set_config('app.utilisateur_auteur', '', true), set_config('app.utilisateur_source', ${SOURCES_UTILISATEUR.reinitialisationCA}, true)`;

      // 3. Réinitialiser les CA dans utilisateurs
      await tx.utilisateurs.updateMany({
        where: {
          id: { in: usersWithHistory.map(u => u.user_id) }
        },
        data: { chiffre_affaires: 0 }
      });

      // 4. Recalculer les rétrocessions (retour au taux de base)
      for (const userHistory of usersWithHistory) {
        const baseRetrocession = calculRetrocession(
          userHistory.utilisateurs.typecontrat || "",
          0,
          userHistory.utilisateurs.auto_parrain || undefined
        );

        await tx.utilisateurs.update({
          where: { id: userHistory.user_id },
          data: { retrocession: baseRetrocession }
        });
      }
    });

    console.log(`✅ Réinitialisation annuelle terminée pour ${currentYear}`);
    return true;

  } catch (error) {
    console.error("❌ Erreur lors de la réinitialisation annuelle:", error);
    throw error;
  }
}
