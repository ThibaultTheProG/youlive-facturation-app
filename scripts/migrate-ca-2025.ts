import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL n\'est pas définie');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function migrateCa2025() {
  console.log('🚀 Migration du CA 2025 vers historique_ca_annuel...\n');

  try {
    // Récupérer tous les utilisateurs avec un CA > 0
    const utilisateurs = await prisma.utilisateurs.findMany({
      where: {
        chiffre_affaires: {
          gt: 0
        }
      },
      select: {
        id: true,
        chiffre_affaires: true,
        retrocession: true,
        typecontrat: true,
        auto_parrain: true,
        prenom: true,
        nom: true
      }
    });

    console.log(`📊 ${utilisateurs.length} utilisateurs avec CA > 0 trouvés\n`);

    let migrated = 0;
    let skipped = 0;

    for (const user of utilisateurs) {
      // Vérifier si l'historique 2025 existe déjà
      const existing = await prisma.historique_ca_annuel.findUnique({
        where: {
          user_id_annee: {
            user_id: user.id,
            annee: 2025
          }
        }
      });

      if (existing) {
        console.log(`⏭️  ${user.prenom} ${user.nom} - Déjà migré`);
        skipped++;
        continue;
      }

      // Créer l'enregistrement historique
      await prisma.historique_ca_annuel.create({
        data: {
          user_id: user.id,
          annee: 2025,
          chiffre_affaires: user.chiffre_affaires || 0,
          retrocession_finale: user.retrocession || 0,
          typecontrat: user.typecontrat,
          auto_parrain: user.auto_parrain,
          date_cloture: null // 2025 pas encore clôturée
        }
      });

      console.log(
        `✅ ${user.prenom} ${user.nom} - CA: ${user.chiffre_affaires}€ - Rétro: ${user.retrocession}%`
      );
      migrated++;
    }

    console.log(`\n✨ Migration terminée !`);
    console.log(`   - ${migrated} utilisateurs migrés`);
    console.log(`   - ${skipped} utilisateurs ignorés (déjà migrés)`);

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

migrateCa2025();
