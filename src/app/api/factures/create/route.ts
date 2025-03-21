import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { PrismaClient } from "@prisma/client";
import { RelationContrat } from "@/lib/types.js";
import nodemailer from "nodemailer";

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

        // Collecter les notifications de la création de factures commission
        const commissionNotifications = await createFactureCommission(relationContrat, tx);
        if (commissionNotifications) {
          notificationsToSend.push(commissionNotifications);
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

// Sous-fonction pour créer une facture de type "commission"
async function createFactureCommission(
  contrat: RelationContrat,
  prisma: PrismaTransaction
): Promise<EmailNotification | null> {
  const { relationid, user_id, honoraires_agent, retrocession } = contrat;

  // Vérification du taux de rétrocession
  if (!retrocession || retrocession < 60) {
    console.log(`⚠️ Pas de facture générée pour l'utilisateur ${user_id} : taux de rétrocession ${retrocession}% < 60%`);
    return null;
  }

  const retrocessionAmount = Number((honoraires_agent * (retrocession / 100)).toFixed(2));

  try {
    // Créer la facture
    const result = await prisma.factures.upsert({
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
        statut_paiement: 'non payé',
        created_at: new Date()
      }
    });

    console.log(`✅ Facture commission créée/mise à jour pour l'utilisateur ${user_id}`);
    
    // Vérifier si c'est une nouvelle facture en comparant la date de création avec la date actuelle
    const isNewInvoice = result.created_at && 
      new Date().getTime() - new Date(result.created_at).getTime() < 1000; // moins d'une seconde d'écart
    
    // Ne renvoyer la notification que si c'est une nouvelle facture
    if (isNewInvoice) {
      return {
        userId: user_id,
        factureType: 'commission',
        montant: retrocessionAmount
      };
    }
    
    return null;
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

        const retrocessionAmount = Number(((honoraires_agent * percentage) / 100).toFixed(2));

        const result = await prisma.factures.upsert({
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
            statut_paiement: 'non payé',
            created_at: new Date()
          }
        });

        console.log(`✅ Facture parrainage créée/mise à jour pour le parrain ${parrainId} (${percentage}%)`);
        
        // Vérifier si c'est une nouvelle facture en comparant la date de création avec la date actuelle
        const isNewInvoice = result.created_at && 
          new Date().getTime() - new Date(result.created_at).getTime() < 1000; // moins d'une seconde d'écart
        
        // Ne renvoyer la notification que si c'est une nouvelle facture
        if (isNewInvoice) {
          notifications.push({
            userId: parrainId,
            factureType: 'recrutement',
            montant: retrocessionAmount
          });
        }
      }
    }
    
    return notifications;
  } catch (error) {
    console.error("❌ Erreur lors de la création des factures de parrainage :", error);
    throw error;
  }
}

// // Fonction pour envoyer une notification par email
async function sendEmailNotification(userId: number, factureType: string, montant: number) {
  try {
    // Pour les tests, on envoie toujours à cette adresse
    const testEmail = "tuffinthibaultgw@gmail.com";
    
    // Dans un environnement de production, on récupérerait l'email du conseiller
    // const user = await prisma.utilisateurs.findUnique({
    //   where: { id: userId },
    //   select: { email: true, prenom: true, nom: true }
    // });
    // const email = user?.email;
    
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
      to: testEmail,
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
          <p>Vous pouvez consulter cette facture dans votre espace personnel.</p>
          <p>Cordialement,<br>L'équipe YouLive</p>
        </div>
      `
    };
    
    console.log("📧 Tentative d'envoi d'email à:", testEmail);
    
    // Envoi de l'email
    const info = await transporter.sendMail(mailOptions);
    
    console.log(`✉️ Notification envoyée pour la facture de type ${factureType}:`, info.messageId);
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi de la notification par email:", error);
    // On ne propage pas l'erreur pour ne pas bloquer la création de facture
  }
}