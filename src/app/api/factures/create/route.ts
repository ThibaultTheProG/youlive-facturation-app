import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { PrismaClient } from "@prisma/client";
import { RelationContrat } from "@/lib/types.js";

// Type pour la transaction Prisma
type PrismaTransaction = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export async function GET(request: Request) {
  console.log("🚀 Requête reçue :", request.url);

  try {
    await createFacture();
    console.log("✅ Factures générées avec succès.");
    return NextResponse.json({ message: "Ok" });
  } catch (error) {
    console.error("❌ Erreur lors de la génération des factures :", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}

// Fonction principale
async function createFacture() {
  try {
    // Utiliser une transaction Prisma
    await prisma.$transaction(async (tx) => {
      // 1. Récupérer les contrats avec leurs relations
      const contrats = await tx.relations_contrats.findMany({
        select: {
          id: true,
          honoraires_agent: true,
          user_id: true,
          contrats: {
            select: {
              id: true
            }
          },
          utilisateurs: {
            select: {
              retrocession: true
            }
          }
        }
      });

      // 2. Créer les factures pour chaque contrat
      for (const contrat of contrats) {
        const relationContrat: RelationContrat = {
          honoraires_agent: Number(contrat.honoraires_agent),
          user_id: contrat.user_id,
          retrocession: Number(contrat.utilisateurs.retrocession),
          relationid: contrat.id
        };

        await createFactureCommission(relationContrat, tx);
        await createFactureRecrutement(relationContrat, tx);
      }
    });

    console.log("✅ Factures créées avec succès.");
  } catch (error) {
    console.error("❌ Erreur lors de la création des factures :", error);
    throw error;
  }
}

// Sous-fonction pour créer une facture de type "commission"
async function createFactureCommission(
  contrat: RelationContrat,
  prisma: PrismaTransaction
) {
  const { relationid, user_id, honoraires_agent, retrocession } = contrat;

  // Vérification du taux de rétrocession
  if (!retrocession || retrocession < 60) {
    console.log(`⚠️ Pas de facture générée pour l'utilisateur ${user_id} : taux de rétrocession ${retrocession}% < 60%`);
    return;
  }

  const retrocessionAmount =  Number((honoraires_agent * (retrocession / 100)).toFixed(2));

  try {
    // Créer la facture
    await prisma.factures.upsert({
      where: {
        relation_id_type_user_id: {
          relation_id: relationid,
          type: 'commission',
          user_id: user_id
        }
      },
      update: {
        retrocession: retrocessionAmount
      },
      create: {
        relation_id: relationid,
        user_id: user_id,
        type: 'commission',
        retrocession: retrocessionAmount,
        statut_paiement: 'non payé'
      }
    });

    console.log(`✅ Facture commission créée pour l'utilisateur ${user_id}`);
  } catch (error) {
    console.error("❌ Erreur lors de la création de la facture commission :", error);
    throw error;
  }
}

// Sous-fonction pour créer des factures de type "parrainage"
async function createFactureRecrutement(
  contrat: RelationContrat,
  prisma: PrismaTransaction
) {
  const { relationid, user_id, honoraires_agent } = contrat;

  try {
    // Vérifier le chiffre d'affaires
    const utilisateur = await prisma.utilisateurs.findUnique({
      where: { id: user_id },
      select: { chiffre_affaires: true }
    });

    if (!utilisateur) {
      console.log("❌ Utilisateur non trouvé :", user_id);
      return;
    }

    // Si CA >= 70 000€, ne pas générer de facture de parrainage
    if (Number(utilisateur.chiffre_affaires) >= 70000) {
      console.log(`CA >= 70 000€ pour l'utilisateur ${user_id}, pas de facture de parrainage.`);
      return;
    }

    // Récupérer les parrains
    const parrainages = await prisma.parrainages.findMany({
      where: {
        user_id: user_id
      },
      select: {
        niveau1: true,
        niveau2: true,
        niveau3: true
      }
    });

    if (parrainages.length === 0) {
      console.log(`❌ Aucun parrain trouvé pour l'utilisateur ${user_id}`);
      return;
    }

    // Traiter chaque niveau de parrainage
    for (const parrainage of parrainages) {
      // Vérifier si le parrain de niveau 1 est associé à au moins 5 filleuls
      let niveau1Percentage = 6; // Pourcentage par défaut
      
      if (parrainage.niveau1) {
        // Compter combien de filleuls sont associés à ce parrain de niveau 1
        const filleulsCount = await prisma.parrainages.count({
          where: {
            niveau1: parrainage.niveau1
          }
        });
        
        // Si le parrain est associé à au moins 5 filleuls, augmenter le pourcentage à 8%
        if (filleulsCount >= 5) {
          niveau1Percentage = 8;
          console.log(`Le parrain ${parrainage.niveau1} a ${filleulsCount} filleuls, pourcentage augmenté à 8%`);
        }
      }
      
      const niveaux = [
        { id: parrainage.niveau1, percentage: niveau1Percentage },
        { id: parrainage.niveau2, percentage: 2 },
        { id: parrainage.niveau3, percentage: 1 }
      ];

      for (const { id: parrainId, percentage } of niveaux) {
        if (!parrainId) continue;

        const retrocessionAmount = Number(((honoraires_agent * percentage) / 100).toFixed(2));

        await prisma.factures.upsert({
          where: {
            relation_id_type_user_id: {
              relation_id: relationid,
              type: 'recrutement',
              user_id: parrainId
            }
          },
          update: {
            retrocession: retrocessionAmount
          },
          create: {
            relation_id: relationid,
            user_id: parrainId,
            type: 'recrutement',
            retrocession: retrocessionAmount,
            statut_paiement: 'non payé'
          }
        });

        console.log(`✅ Facture parrainage créée pour le parrain ${parrainId} (${percentage}%)`);
      }
    }
  } catch (error) {
    console.error("❌ Erreur lors de la création des factures de parrainage :", error);
    throw error;
  }
}