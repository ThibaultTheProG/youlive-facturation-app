import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";
import { FactureDetaillee, Contact } from "@/lib/types";

export async function GET(request: Request) {
  try {
    // Récupérer l'URL actuelle et extraire l'ID à partir de `searchParams`
    const url = new URL(request.url);
    const factureIdParam = url.pathname.split("/").pop(); // Récupérer l'ID depuis l'URL

    if (!factureIdParam) {
      return NextResponse.json(
        { error: "ID de facture manquant" },
        { status: 400 }
      );
    }

    const factureId = Number(factureIdParam);

    if (isNaN(factureId)) {
      return NextResponse.json(
        { error: "ID de facture invalide" },
        { status: 400 }
      );
    }

    // Récupération de la facture directement dans la route
    const result = await prisma.factures.findUnique({
      where: {
        id: factureId
      },
      include: {
        relations_contrats: {
          include: {
            contrats: {
              include: {
                property: true
              }
            },
            utilisateurs: true // Inclure l'utilisateur associé à la relation_contrat (le filleul)
          }
        }
      }
    });

    if (!result) {
      return NextResponse.json(
        { error: "Facture introuvable" },
        { status: 404 }
      );
    }

    // Récupérer l'utilisateur associé à la facture dans une requête séparée
    const utilisateur = result.user_id 
      ? await prisma.utilisateurs.findUnique({
          where: { id: result.user_id }
        })
      : null;

    // Récupérer le filleul (celui qui a réalisé la vente)
    const filleul = result.relations_contrats?.utilisateurs 
      ? {
          id: result.relations_contrats.utilisateurs.id,
          prenom: result.relations_contrats.utilisateurs.prenom || '',
          nom: result.relations_contrats.utilisateurs.nom || ''
        }
      : undefined;

    // Récupération des contacts associés au contrat
    const contratId = result.relations_contrats?.contrats?.id;
    
    // Récupérer les acheteurs (type 1) et les propriétaires (type 2)
    const contactsContrats = contratId ? await prisma.contacts_contrats.findMany({
      where: {
        contrat_id: contratId
      },
      include: {
        contrats: true
      }
    }) : [];

    // Récupérer les informations détaillées des contacts
    const contactIds = contactsContrats.map(cc => cc.contact_id);
    const contactsDetails = contactIds.length > 0 ? await prisma.contacts.findMany({
      where: {
        contact_apimo_id: {
          in: contactIds
        }
      }
    }) : [];

    // Séparer les acheteurs et les propriétaires
    const acheteurs: Contact[] = [];
    const proprietaires: Contact[] = [];

    for (const contactContrat of contactsContrats) {
      // Trouver les détails du contact correspondant
      const contactDetail = contactsDetails.find(c => c.contact_apimo_id === contactContrat.contact_id);
      
      if (!contactDetail) continue;
      
      const contact: Contact = {
        id: contactDetail.contact_apimo_id,
        prenom: contactDetail.prenom || '',
        nom: contactDetail.nom || '',
        email: contactDetail.email || '',
        mobile: contactDetail.mobile,
        phone: null,
        adresse: contactDetail.adresse || '',
        ville: {
          name: contactDetail.ville || '',
          zipcode: contactDetail.cp || ''
        }
      };

      // Type 1 = acheteur, Type 2 = propriétaire
      if (contactContrat.type === 1) {
        acheteurs.push(contact);
      } else if (contactContrat.type === 2) {
        proprietaires.push(contact);
      }
    }

    // Transformation des données pour le format FactureDetaillee
    const facture: FactureDetaillee = {
      id: result.id,
      type: result.type || '',
      honoraires_agent: result.relations_contrats?.honoraires_agent?.toString() || "0",
      retrocession: result.retrocession?.toString() || "0",
      statut_paiement: result.statut_paiement || '',
      created_at: result.created_at?.toISOString() || '',
      numero_mandat: result.relations_contrats?.contrats?.property?.numero_mandat || '',
      date_signature: result.relations_contrats?.contrats?.date_signature?.toISOString() || '',
      numero: result.numero || '',
      vat_rate: 20, // Valeur par défaut si non définie
      apporteur: result.apporteur,
      apporteur_amount: result.apporteur_amount || 0,

      conseiller: {
        idapimo: utilisateur?.idapimo || 0,
        id: utilisateur?.id || 0,
        prenom: utilisateur?.prenom || '',
        nom: utilisateur?.nom || '',
        email: utilisateur?.email || '',
        telephone: utilisateur?.telephone || '',
        adresse: utilisateur?.adresse || '',
        mobile: utilisateur?.mobile || '',
        siren: Number(utilisateur?.siren || 0),
        tva: utilisateur?.tva || false,
        chiffre_affaires: Number(utilisateur?.chiffre_affaires || 0),
        retrocession: Number(utilisateur?.retrocession || 0),
        // Informations facture de recrutement
        nom_societe_facture: utilisateur?.nom_societe_facture || '',
        siren_facture: utilisateur?.siren_facture || '',
        adresse_facture: utilisateur?.adresse_facture || '',
      },

      contrat: {
        id: result.relations_contrats?.contrats?.id.toString() || '',
        step: 'completed',
        commission: result.relations_contrats?.contrats?.honoraires?.toString() || '0',
        date_signature: result.relations_contrats?.contrats?.date_signature?.toISOString() || ''
      },

      propriete: {
        id: result.relations_contrats?.contrats?.property?.id.toString() || '',
        adresse: result.relations_contrats?.contrats?.property?.adresse || '',
        reference: result.relations_contrats?.contrats?.property?.numero_mandat || ''
      },

      acheteurs,
      proprietaires,
      filleul
    };

    return NextResponse.json(facture);
  } catch (error) {
    console.error("Erreur lors de la récupération de la facture :", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const url = new URL(request.url);
    const factureIdParam = url.pathname.split("/").pop();

    if (!factureIdParam) {
      return NextResponse.json(
        { error: "ID de facture manquant" },
        { status: 400 }
      );
    }

    const factureId = Number(factureIdParam);

    if (isNaN(factureId)) {
      return NextResponse.json(
        { error: "ID de facture invalide" },
        { status: 400 }
      );
    }

    const { statut_paiement, numero, created_at, apporteur, apporteur_amount } =
      await request.json();


      console.log(statut_paiement, numero, created_at, apporteur, apporteur_amount);

    // // Vérifier les données à mettre à jour
    // if (!numero && !created_at) {
    //   console.error("Aucune donnée à mettre à jour");
    //   return NextResponse.json(
    //     { error: "Aucune donnée à mettre à jour" },
    //     { status: 400 }
    //   );
    // }

    // Construire l'objet de mise à jour pour Prisma
    const updateData: Prisma.facturesUpdateInput = {
      updated_at: new Date(),
    };

    if (statut_paiement) updateData.statut_paiement = statut_paiement;
    if (numero) updateData.numero = numero;
    if (created_at) updateData.created_at = new Date(created_at);
    if (apporteur) updateData.apporteur = apporteur;
    if (apporteur_amount) updateData.apporteur_amount = apporteur_amount;

    const result = await prisma.factures.update({
      where: {
        id: factureId,
      },
      data: updateData,
      select: {
        id: true,
        statut_paiement: true,
        numero: true,
        created_at: true,
      },
    });

    return NextResponse.json(
      {
        message: "Mise à jour effectuée avec succès",
        updatedData: result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la facture :", error);
    
    // Gestion spécifique de l'erreur Prisma pour facture non trouvée
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json(
        { error: "Facture introuvable ou non mise à jour" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
