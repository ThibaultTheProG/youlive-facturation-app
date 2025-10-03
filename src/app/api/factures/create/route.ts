import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { PrismaClient } from "@prisma/client";
import { RelationContrat } from "@/lib/types.js";
import nodemailer from "nodemailer";
import { calculRetrocession } from "@/utils/calculs";

// Type pour la transaction Prisma
type PrismaTransaction = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

// Structure pour stocker les notifications à envoyer
interface EmailNotification {
  userId: number;
  factureType: string;
  montant: number;
}

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
    // Tableau pour stocker les notifications à envoyer après la transaction
    const notificationsToSend: EmailNotification[] = [];

    // Utiliser une transaction Prisma avec un délai plus long (30 secondes)
    await prisma.$transaction(async (tx) => {
      // 0. Mettre à jour les factures de recrutement existantes avec le bon taux
      //await updateExistingRecrutementFactures(tx);

      //test commit 29/08/25

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
          relationid: contrat.id
        };

        // Collecter les notifications de la création de factures commission
        const commissionNotifications = await createFactureCommission(relationContrat, tx);
        if (commissionNotifications) {
          notificationsToSend.push(...commissionNotifications);
        }

        // Collecter les notifications de la création de factures recrutement
        const recrutementNotifications = await createFactureRecrutement(relationContrat, tx);
        if (recrutementNotifications && recrutementNotifications.length > 0) {
          notificationsToSend.push(...recrutementNotifications);
        }
      }
    }, {
      timeout: 30000 // 30 secondes au lieu des 5 secondes par défaut
    });

    console.log("✅ Factures créées avec succès.");

    // Envoyer les notifications après la fin de la transaction
    console.log(`📧 Envoi de ${notificationsToSend.length} notifications...`);
    for (const notification of notificationsToSend) {
      await sendEmailNotification(
        notification.userId,
        notification.factureType,
        notification.montant
      );
    }
  } catch (error) {
    console.error("❌ Erreur lors de la création des factures :", error);
    throw error;
  }
}

// // Fonction pour mettre à jour les factures de recrutement existantes
// async function updateExistingRecrutementFactures(prisma: PrismaTransaction) {
//   try {
//     console.log("🔄 Mise à jour des factures de recrutement existantes...");
    
//     // Récupérer toutes les factures de recrutement existantes
//     const facturesRecrutement = await prisma.factures.findMany({
//       where: {
//         type: 'recrutement'
//       },
//       select: {
//         id: true,
//         relation_id: true,
//         user_id: true,
//         retrocession: true,
//         montant_honoraires: true,
//         taux_retrocession: true
//       }
//     });

//     let updatedCount = 0;

//     for (const facture of facturesRecrutement) {
//       // Calculer le pourcentage de parrainage basé sur le montant de rétrocession et les honoraires
//       if (facture.montant_honoraires && facture.retrocession) {
//         const honoraires = Number(facture.montant_honoraires);
//         const retrocession = Number(facture.retrocession);
//         const tauxCalcule = (retrocession / honoraires) * 100;
        
//         // Vérifier si le taux actuel est incorrect (70 ou 99)
//         const tauxActuel = Number(facture.taux_retrocession);
//         if (tauxActuel === 70 || tauxActuel === 99) {
//           // Mettre à jour avec le taux calculé
//           await prisma.factures.update({
//             where: { id: facture.id },
//             data: {
//               taux_retrocession: tauxCalcule
//             }
//           });
          
//           console.log(`✅ Facture recrutement ${facture.id} mise à jour: ${tauxActuel}% → ${tauxCalcule.toFixed(2)}%`);
//           updatedCount++;
//         }
//       }
//     }

//     console.log(`✅ ${updatedCount} factures de recrutement mises à jour.`);
//   } catch (error) {
//     console.error("❌ Erreur lors de la mise à jour des factures de recrutement :", error);
//     throw error;
//   }
// }

// Sous-fonction pour créer une facture de type "commission"
async function createFactureCommission(
  contrat: RelationContrat,
  prisma: PrismaTransaction
): Promise<EmailNotification[]> {
  const { relationid, user_id, honoraires_agent } = contrat;
  const notifications: EmailNotification[] = [];

  try {
    // Vérifier d'abord si des factures existent déjà pour cette relation
    const facturesExistantes = await prisma.factures.findMany({
      where: {
        relation_id: relationid,
        user_id: user_id,
        type: 'commission'
      }
    });

    // Si des factures existent déjà, ne rien créer
    if (facturesExistantes.length > 0) {
      console.log(`⚠️ Factures commission déjà existantes pour la relation ${relationid}, utilisateur ${user_id}`);
      return notifications;
    }

    // Récupérer les informations de l'utilisateur
    const utilisateur = await prisma.utilisateurs.findUnique({
      where: { id: user_id },
      select: { 
        chiffre_affaires: true,
        typecontrat: true,
        auto_parrain: true
      }
    });

    if (!utilisateur) {
      console.log(`❌ Utilisateur non trouvé : ${user_id}`);
      return notifications;
    }

    const currentCA = Number(utilisateur.chiffre_affaires || 0);
    const newCA = currentCA + honoraires_agent;
    const seuil = 70000;

    // Calculer les montants pour chaque tranche
    let montantAvantSeuil = 0;
    let montantApresSeuil = 0;

    if (currentCA < seuil && newCA > seuil) {
      // Le CA va dépasser le seuil avec ce contrat
      montantAvantSeuil = seuil - currentCA;
      montantApresSeuil = honoraires_agent - montantAvantSeuil;
      console.log(`📊 CA va dépasser le seuil: ${currentCA}€ → ${newCA}€ (avant: ${montantAvantSeuil}€, après: ${montantApresSeuil}€)`);
    } else if (currentCA >= seuil) {
      // Le CA est déjà au-dessus du seuil
      montantApresSeuil = honoraires_agent;
      console.log(`📊 CA déjà au-dessus du seuil: ${currentCA}€ (après: ${montantApresSeuil}€)`);
    } else {
      // Le CA reste en-dessous du seuil
      montantAvantSeuil = honoraires_agent;
      console.log(`📊 CA reste en-dessous du seuil: ${currentCA}€ → ${newCA}€ (avant: ${montantAvantSeuil}€)`);
    }

    // Calculer les taux de rétrocession seulement si nécessaire
    let tauxAvantSeuil = 0;
    let tauxApresSeuil = 0;
    
    if (montantAvantSeuil > 0) {
      tauxAvantSeuil = calculRetrocession(
        utilisateur.typecontrat || "",
        currentCA,
        utilisateur.auto_parrain || undefined
      );
    }
    
    if (montantApresSeuil > 0) {
      tauxApresSeuil = calculRetrocession(
        utilisateur.typecontrat || "",
        seuil,
        utilisateur.auto_parrain || undefined
      );
    }

    console.log(`📊 Taux calculés: avant seuil ${tauxAvantSeuil}%, après seuil ${tauxApresSeuil}%`);

    // Créer les factures pour chaque tranche si nécessaire
    if (montantAvantSeuil > 0) {
      const retrocessionAvantSeuil = Number((montantAvantSeuil * (tauxAvantSeuil / 100)).toFixed(2));
      
      await prisma.factures.create({
        data: {
          relation_id: relationid,
          user_id: user_id,
          type: 'commission',
          retrocession: retrocessionAvantSeuil,
          montant_honoraires: montantAvantSeuil,
          taux_retrocession: tauxAvantSeuil,
          tranche: 'avant_seuil',
          statut_paiement: 'non payé',
          statut_envoi: 'non envoyée',
          created_at: new Date(),
          added_at: new Date()
        }
      });

      console.log(`✅ Facture commission avant seuil créée pour l'utilisateur ${user_id}: ${retrocessionAvantSeuil}€ (${tauxAvantSeuil}% de ${montantAvantSeuil}€)`);
      
      notifications.push({
        userId: user_id,
        factureType: 'commission_avant_seuil',
        montant: retrocessionAvantSeuil
      });
    }

    if (montantApresSeuil > 0) {
      const retrocessionApresSeuil = Number((montantApresSeuil * (tauxApresSeuil / 100)).toFixed(2));
      
      await prisma.factures.create({
        data: {
          relation_id: relationid,
          user_id: user_id,
          type: 'commission',
          retrocession: retrocessionApresSeuil,
          montant_honoraires: montantApresSeuil,
          taux_retrocession: tauxApresSeuil,
          tranche: 'apres_seuil',
          statut_paiement: 'non payé',
          statut_envoi: 'non envoyée',
          created_at: new Date(),
          added_at: new Date()
        }
      });

      console.log(`✅ Facture commission après seuil créée pour l'utilisateur ${user_id}: ${retrocessionApresSeuil}€ (${tauxApresSeuil}% de ${montantApresSeuil}€)`);
      
      notifications.push({
        userId: user_id,
        factureType: 'commission_apres_seuil',
        montant: retrocessionApresSeuil
      });
    }

    return notifications;
  } catch (error) {
    console.error("❌ Erreur lors de la création de la facture commission :", error);
    throw error;
  }
}

// Sous-fonction pour créer des factures de type "parrainage"
async function createFactureRecrutement(
  contrat: RelationContrat,
  prisma: PrismaTransaction
): Promise<EmailNotification[]> {
  const { relationid, user_id, honoraires_agent } = contrat;
  const notifications: EmailNotification[] = [];

  try {
    // Vérifier le chiffre d'affaires
    const utilisateur = await prisma.utilisateurs.findUnique({
      where: { id: user_id },
      select: { chiffre_affaires: true }
    });

    if (!utilisateur) {
      console.log("❌ Utilisateur non trouvé :", user_id);
      return notifications;
    }

    // Si CA >= 70 000€, ne pas générer de facture de parrainage
    if (Number(utilisateur.chiffre_affaires) >= 70000) {
      console.log(`CA >= 70 000€ pour l'utilisateur ${user_id}, pas de facture de parrainage.`);
      return notifications;
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
      return notifications;
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

        // Récupérer le taux de rétrocession du parrain depuis la table utilisateurs
        const parrain = await prisma.utilisateurs.findUnique({
          where: { id: parrainId },
          select: { retrocession: true }
        });

        if (!parrain) {
          console.log(`❌ Parrain non trouvé : ${parrainId}`);
          continue;
        }

        const retrocessionAmount = Number(((honoraires_agent * percentage) / 100).toFixed(2));

        // Vérifier si une facture de recrutement existe déjà pour cette relation et ce parrain
        const existingFacture = await prisma.factures.findFirst({
          where: {
            relation_id: relationid,
            type: 'recrutement',
            user_id: parrainId
          }
        });

        // Si une facture de recrutement existe déjà pour cette relation et ce parrain, passer au suivant
        if (existingFacture) {
          console.log(`⚠️ Facture recrutement déjà existante pour le parrain ${parrainId} et la relation ${relationid}, pas de création`);
          continue;
        }

        // Créer la nouvelle facture
        await prisma.factures.create({
          data: {
            relation_id: relationid,
            user_id: parrainId,
            type: 'recrutement',
            retrocession: retrocessionAmount, // Stocker le montant de rétrocession
            montant_honoraires: honoraires_agent, // Stocker le montant des honoraires pour le calcul
            taux_retrocession: percentage, // Stocker le pourcentage de parrainage (6%, 8%, 2%, 1%)
            tranche: 'avant_seuil',
            statut_paiement: 'non payé',
            statut_envoi: 'non envoyée',
            created_at: new Date(),
            added_at: new Date()
          }
        });

        console.log(`✅ Nouvelle facture recrutement créée pour le parrain ${parrainId} (${percentage}%)`);
        
        notifications.push({
          userId: parrainId,
          factureType: 'recrutement',
          montant: retrocessionAmount
        });
      }
    }
    
    return notifications;
  } catch (error) {
    console.error("❌ Erreur lors de la création des factures de parrainage :", error);
    throw error;
  }
}

// // // Fonction pour envoyer une notification par email
async function sendEmailNotification(userId: number, factureType: string, montant: number) {
  try {
    // Pour les tests, on envoie toujours à cette adresse
    // const testEmail = "tuffinthibaultgw@gmail.com";
    
    // Dans un environnement de production, on récupérerait l'email du conseiller
    const user = await prisma.utilisateurs.findUnique({
      where: { id: userId },
      select: { email: true, prenom: true, nom: true }
    });
    const email = user?.email;
    
    // Configuration du transporteur d'emails
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_SERVER_HOST,
      port: Number(process.env.SMTP_SERVER_PORT),
      secure: true, // true pour le port 465, false pour 587
      auth: {
        user: process.env.SMTP_SERVER_USERNAME,
        pass: process.env.SMTP_SERVER_PASSWORD,
      },
    });
    
    // Configuration de l'email
    const mailOptions = {
      from: process.env.SMTP_FROM_EMAIL,
      to: `${email}`,
      subject: `Nouvelle facture ${factureType} créée`,
      text: `Une nouvelle facture de type ${factureType} d'un montant de ${montant.toLocaleString()} € a été créée pour vous.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
          <h2 style="color: #e67e22;">Nouvelle facture créée</h2>
          <p>Bonjour,</p>
          <p>Une nouvelle facture a été créée dans votre espace :</p>
          <ul>
            <li><strong>Type :</strong> ${factureType}</li>
            <li><strong>Montant :</strong> ${montant.toLocaleString()} €</li>
          </ul>
          <p>Vous pouvez consulter cette facture dans votre espace personnel en cliquant ici : ${process.env.NEXT_PUBLIC_BASE_URL}</p>
          <p>Cordialement,<br>L'équipe YouLive</p>
        </div>
      `
    };
    
    console.log("📧 Tentative d'envoi d'email à:", email);
    
    // Envoi de l'email
    const info = await transporter.sendMail(mailOptions);
    
    console.log(`✉️ Notification envoyée pour la facture de type ${factureType}:`, info.messageId);
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi de la notification par email:", error);
    // On ne propage pas l'erreur pour ne pas bloquer la création de facture
  }
}