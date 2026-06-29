import { NextResponse } from "next/server";
import prisma from "@/lib/db";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { PrismaClient } from "@prisma/client";
import { RelationContrat } from "@/lib/types.js";
import nodemailer from "nodemailer";
import { decoupageSeuil, round2 } from "@/utils/decoupageSeuil";
import { getCAForYear, getHistoriqueForYear } from "@/utils/historiqueCA";

// Type pour la transaction Prisma
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaTransaction = any;

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

    // 1. Récupérer UNIQUEMENT les contrats récents (derniers 7 jours) pour éviter de tout retraiter
    // Une fenêtre de 7 jours permet de rattraper d'éventuelles factures de recrutement manquantes
    const septJoursEnArriere = new Date();
    septJoursEnArriere.setDate(septJoursEnArriere.getDate() - 7);

    const contrats = await prisma.relations_contrats.findMany({
      where: {
        created_at: {
          gte: septJoursEnArriere
        }
      },
      select: {
        id: true,
        honoraires_agent: true,
        user_id: true,
        created_at: true,
        contrats: {
          select: {
            id: true,
            date_signature: true
          }
        },
        utilisateurs: {
          select: {
            retrocession: true
          }
        }
      }
    });

    console.log(`📊 Traitement de ${contrats.length} contrats récents (créés depuis le ${septJoursEnArriere.toISOString()})...`);

    // Trier les contrats par date de signature croissante : le découpage au seuil
    // doit être appliqué chronologiquement (le 1er contrat de l'année consomme la
    // tranche < seuil avant les suivants).
    const contratsTries = [...contrats].sort((a, b) => {
      const da = a.contrats?.date_signature ? new Date(a.contrats.date_signature).getTime() : 0;
      const db = b.contrats?.date_signature ? new Date(b.contrats.date_signature).getTime() : 0;
      return da - db;
    });

    // CA accumulé par (utilisateur, année), initialisé à partir du « CA déjà facturé »
    // (somme des montant_honoraires des factures commission existantes de l'année),
    // puis incrémenté contrat par contrat. Sert de base fiable au découpage au seuil.
    const caAccumule = new Map<string, number>();

    const getCAAvantContrat = async (userId: number, year: number): Promise<number> => {
      const key = `${userId}-${year}`;
      if (caAccumule.has(key)) {
        return caAccumule.get(key)!;
      }
      const debutAnnee = new Date(Date.UTC(year, 0, 1));
      const finAnnee = new Date(Date.UTC(year + 1, 0, 1));
      const facturesAnnee = await prisma.factures.findMany({
        where: {
          user_id: userId,
          type: 'commission',
          relations_contrats: {
            contrats: {
              date_signature: { gte: debutAnnee, lt: finAnnee }
            }
          }
        },
        select: { montant_honoraires: true }
      });
      const base = round2(facturesAnnee.reduce(
        (sum: number, f: { montant_honoraires: unknown }) => sum + Number(f.montant_honoraires ?? 0),
        0
      ));
      caAccumule.set(key, base);
      return base;
    };

    // 2. Traiter chaque contrat individuellement (sans grande transaction globale)
    for (const contrat of contratsTries) {
      const relationContrat: RelationContrat = {
        honoraires_agent: Number(contrat.honoraires_agent),
        user_id: contrat.user_id,
        relationid: contrat.id
      };

      // Déterminer l'année du contrat à partir de la date de signature
      const dateSignature = contrat.contrats?.date_signature;
      const contratYear = dateSignature ? new Date(dateSignature).getFullYear() : new Date().getFullYear();
      const key = `${contrat.user_id}-${contratYear}`;

      // CA du conseiller AVANT ce contrat (base + contrats déjà traités ce run)
      const currentCA = await getCAAvantContrat(contrat.user_id, contratYear);

      // Collecter les notifications de la création de factures commission
      const { notifications: commissionNotifications, invoicedHonoraires } =
        await createFactureCommission(relationContrat, prisma, contratYear, currentCA);
      notificationsToSend.push(...commissionNotifications);

      // Si des factures ont réellement été créées, le CA facturé augmente
      if (invoicedHonoraires > 0) {
        caAccumule.set(key, round2(currentCA + invoicedHonoraires));
      }

      // Collecter les notifications de la création de factures recrutement
      const recrutementNotifications = await createFactureRecrutement(relationContrat, prisma, contratYear);
      if (recrutementNotifications && recrutementNotifications.length > 0) {
        notificationsToSend.push(...recrutementNotifications);
      }
    }

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
  prisma: PrismaTransaction,
  contratYear: number,
  currentCA: number
): Promise<{ notifications: EmailNotification[]; invoicedHonoraires: number }> {
  const { relationid, user_id, honoraires_agent } = contrat;
  const notifications: EmailNotification[] = [];
  const currentYear = new Date().getFullYear();

  try {
    // Vérifier d'abord si des factures existent déjà pour cette relation
    const facturesExistantes = await prisma.factures.findMany({
      where: {
        relation_id: relationid,
        user_id: user_id,
        type: 'commission'
      }
    });

    // Si des factures existent déjà, ne rien créer (et ne pas incrémenter le CA accumulé)
    if (facturesExistantes.length > 0) {
      console.log(`⚠️ Factures commission déjà existantes pour la relation ${relationid}, utilisateur ${user_id}`);
      return { notifications, invoicedHonoraires: 0 };
    }

    // Déterminer les données à utiliser selon l'année du contrat
    let typecontrat: string;
    let autoParrain: string | undefined;

    // Récupérer les infos TVA de l'utilisateur
    const utilisateur = await prisma.utilisateurs.findUnique({
      where: { id: user_id },
      select: { typecontrat: true, auto_parrain: true, tva: true, taux_tva: true }
    });
    if (!utilisateur) {
      console.log(`❌ Utilisateur non trouvé : ${user_id}`);
      return { notifications, invoicedHonoraires: 0 };
    }

    const userTva = utilisateur.tva || false;
    const userTauxTva = utilisateur.taux_tva ? Number(utilisateur.taux_tva) : 20;

    if (contratYear < currentYear) {
      // Contrat d'une année précédente : utiliser les données historiques
      const historique = await getHistoriqueForYear(user_id, contratYear);
      if (historique) {
        typecontrat = historique.typecontrat || "";
        autoParrain = historique.auto_parrain || undefined;
        console.log(`📅 Contrat de ${contratYear}: utilisation des données historiques (typecontrat: ${typecontrat}, auto_parrain: ${autoParrain})`);
      } else {
        typecontrat = utilisateur.typecontrat || "";
        autoParrain = utilisateur.auto_parrain || undefined;
        console.log(`⚠️ Pas d'historique pour ${contratYear}, utilisation des données actuelles`);
      }
    } else {
      // Contrat de l'année en cours : utiliser les données actuelles
      typecontrat = utilisateur.typecontrat || "";
      autoParrain = utilisateur.auto_parrain || undefined;
    }

    // IMPORTANT: currentCA est le « CA avant ce contrat » fourni par l'appelant
    // (CA déjà facturé de l'année + contrats plus anciens déjà traités ce run).
    // On NE recalcule PAS depuis getCAForYear, qui inclut déjà tous les contrats
    // récents et fausserait l'attribution du franchissement de seuil entre
    // plusieurs contrats d'un même conseiller.
    // Découpage au seuil délégué à la fonction pure et testée `decoupageSeuil`
    // (arrondi 2 décimales inclus pour neutraliser les artefacts flottants avant
    // comparaison au seuil de 70 000 €).
    const {
      montantAvant: montantAvantSeuil,
      tauxAvant: tauxAvantSeuil,
      montantApres: montantApresSeuil,
      tauxApres: tauxApresSeuil,
    } = decoupageSeuil(currentCA, honoraires_agent, typecontrat, autoParrain);

    console.log(`📊 CA pour calcul des tranches (année ${contratYear}): ${round2(currentCA)}€ → ${round2(currentCA + honoraires_agent)}€ (honoraires: ${honoraires_agent}€)`);
    console.log(`📊 Tranches: avant ${montantAvantSeuil}€ @${tauxAvantSeuil}%, après ${montantApresSeuil}€ @${tauxApresSeuil}%`);

    // Créer les factures pour chaque tranche si nécessaire
    if (montantAvantSeuil > 0) {
      const retrocessionAvantSeuil = Number((montantAvantSeuil * (tauxAvantSeuil / 100)).toFixed(2));
      const montantTvaAvantSeuil = userTva ? Number((retrocessionAvantSeuil * userTauxTva / 100).toFixed(2)) : 0;

      await prisma.factures.create({
        data: {
          relation_id: relationid,
          user_id: user_id,
          type: 'commission',
          retrocession: retrocessionAvantSeuil,
          montant_honoraires: montantAvantSeuil,
          taux_retrocession: tauxAvantSeuil,
          tranche: 'avant_seuil',
          montant_tva: montantTvaAvantSeuil,
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
      const montantTvaApresSeuil = userTva ? Number((retrocessionApresSeuil * userTauxTva / 100).toFixed(2)) : 0;

      await prisma.factures.create({
        data: {
          relation_id: relationid,
          user_id: user_id,
          type: 'commission',
          retrocession: retrocessionApresSeuil,
          montant_honoraires: montantApresSeuil,
          taux_retrocession: tauxApresSeuil,
          tranche: 'apres_seuil',
          montant_tva: montantTvaApresSeuil,
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

    // Des factures ont été créées : on signale le total des honoraires facturés
    // pour que l'appelant incrémente le CA accumulé du conseiller.
    return { notifications, invoicedHonoraires: honoraires_agent };
  } catch (error) {
    console.error("❌ Erreur lors de la création de la facture commission :", error);
    throw error;
  }
}

// Sous-fonction pour créer des factures de type "parrainage"
async function createFactureRecrutement(
  contrat: RelationContrat,
  prisma: PrismaTransaction,
  contratYear: number
): Promise<EmailNotification[]> {
  const { relationid, user_id, honoraires_agent } = contrat;
  const notifications: EmailNotification[] = [];

  try {
    // VÉRIFICATION GLOBALE: Si des factures de recrutement existent déjà pour cette relation, ne rien créer
    const facturesExistantes = await prisma.factures.findMany({
      where: {
        relation_id: relationid,
        type: 'recrutement'
      }
    });

    if (facturesExistantes.length > 0) {
      console.log(`⚠️ ${facturesExistantes.length} facture(s) recrutement déjà existante(s) pour la relation ${relationid}, pas de création`);
      return notifications;
    }

    // Si CA >= 70 000€ pour l'année du contrat, ne pas générer de facture de parrainage
    const caAnneeContrat = await getCAForYear(user_id, contratYear);
    if (caAnneeContrat >= 70000) {
      console.log(`CA >= 70 000€ pour l'utilisateur ${user_id} (année ${contratYear}), pas de facture de parrainage.`);
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

        // Récupérer les infos du parrain depuis la table utilisateurs
        const parrain = await prisma.utilisateurs.findUnique({
          where: { id: parrainId },
          select: { retrocession: true, tva: true, taux_tva: true }
        });

        if (!parrain) {
          console.log(`❌ Parrain non trouvé : ${parrainId}`);
          continue;
        }

        const retrocessionAmount = Number(((honoraires_agent * percentage) / 100).toFixed(2));
        const parrainTva = parrain.tva || false;
        const parrainTauxTva = parrain.taux_tva ? Number(parrain.taux_tva) : 20;
        const montantTvaRecrutement = parrainTva ? Number((retrocessionAmount * parrainTauxTva / 100).toFixed(2)) : 0;

        // Vérifier si une facture de recrutement existe déjà pour cette relation et ce parrain
        // Une seule facture de recrutement par (relation_id, user_id), indépendamment de la tranche
        console.log(`🔍 Vérification facture recrutement: relation_id=${relationid}, user_id=${parrainId}, type=recrutement`);

        const existingFacture = await prisma.factures.findFirst({
          where: {
            relation_id: relationid,
            type: 'recrutement',
            user_id: parrainId
          }
        });

        console.log(`🔍 Résultat vérification: ${existingFacture ? `Facture trouvée (ID: ${existingFacture.id})` : 'Aucune facture existante'}`);

        // Si une facture de recrutement existe déjà pour cette relation et ce parrain, passer au suivant
        if (existingFacture) {
          console.log(`⚠️ Facture recrutement déjà existante (ID: ${existingFacture.id}) pour le parrain ${parrainId} et la relation ${relationid}, pas de création`);
          continue;
        }

        // Double vérification: essayer de créer avec gestion d'erreur si la contrainte unique échoue
        try {
          await prisma.factures.create({
            data: {
              relation_id: relationid,
              user_id: parrainId,
              type: 'recrutement',
              retrocession: retrocessionAmount, // Stocker le montant de rétrocession
              montant_honoraires: honoraires_agent, // Stocker le montant des honoraires pour le calcul
              taux_retrocession: percentage, // Stocker le pourcentage de parrainage (6%, 8%, 2%, 1%)
              tranche: 'avant_seuil',
              montant_tva: montantTvaRecrutement,
              statut_paiement: 'non payé',
              statut_envoi: 'non envoyée',
              created_at: new Date(),
              added_at: new Date()
            }
          });

          console.log(`✅ Nouvelle facture recrutement créée pour le parrain ${parrainId} (${percentage}%) - relation ${relationid}`);

          notifications.push({
            userId: parrainId,
            factureType: 'recrutement',
            montant: retrocessionAmount
          });
        } catch (createError: unknown) {
          // Si l'erreur est une violation de contrainte unique, ignorer silencieusement
          if (createError && typeof createError === 'object' && 'code' in createError && createError.code === 'P2002') {
            console.log(`⚠️ Contrainte unique violée pour le parrain ${parrainId} et la relation ${relationid} - facture déjà existante (ignoré)`);
          } else {
            // Pour toute autre erreur, la relancer
            throw createError;
          }
        }
      }
    }
    
    return notifications;
  } catch (error) {
    console.error("❌ Erreur lors de la création des factures de parrainage :", error);
    throw error;
  }
}

// Fonction pour envoyer une notification par email
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