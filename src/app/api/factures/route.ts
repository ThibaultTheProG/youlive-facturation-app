import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  console.log("🔍 Début de la requête GET /api/factures");
  try {
    // Récupérer les factures avec leurs relations
    console.log("📊 Récupération des factures depuis la base de données...");
    const factures = await prisma.factures.findMany({
      select: {
        id: true,
        user_id: true,
        type: true,
        retrocession: true,
        statut_paiement: true,
        created_at: true,
        numero: true,
        relation_id: true,
      },
      orderBy: {
        created_at: 'desc'
      }
    });
    console.log(`✅ ${factures.length} factures récupérées avec succès`);

    // Récupérer les informations complètes pour chaque facture
    console.log("🔄 Enrichissement des données des factures...");
    const facturesCompletes = [];
    
    for (const facture of factures) {
      try {
        console.log(`📝 Traitement de la facture ID: ${facture.id}`);
        
        // Récupérer les informations de l'utilisateur
        let user = null;
        try {
          if (facture.user_id) {
            console.log(`👤 Récupération des informations de l'utilisateur ID: ${facture.user_id}`);
            user = await prisma.utilisateurs.findUnique({
              where: { id: facture.user_id },
              select: { prenom: true, nom: true }
            });
            console.log(`✅ Informations utilisateur récupérées: ${user?.prenom} ${user?.nom}`);
          } else {
            console.log("⚠️ Pas d'ID utilisateur associé à cette facture");
          }
        } catch (userError) {
          console.error(`❌ Erreur lors de la récupération de l'utilisateur: ${userError}`);
          user = null;
        }

        // Récupérer les informations de la relation contrat
        let propertyInfo = null;
        try {
          if (facture.relation_id) {
            console.log(`🔗 Récupération de la relation contrat ID: ${facture.relation_id}`);
            const relation = await prisma.relations_contrats.findUnique({
              where: { id: facture.relation_id },
              select: { contrat_id: true }
            });

            if (relation) {
              console.log(`📄 Récupération du contrat ID: ${relation.contrat_id}`);
              // Récupérer les informations du contrat et de la propriété associée
              const contrat = await prisma.contrats.findUnique({
                where: { id: relation.contrat_id },
                select: {
                  id: true,
                  property: {
                    select: {
                      numero_mandat: true
                    }
                  }
                }
              });

              if (contrat && contrat.property) {
                console.log(`🏠 Propriété trouvée avec numéro de mandat: ${contrat.property.numero_mandat}`);
                propertyInfo = {
                  numero_mandat: contrat.property.numero_mandat
                };
              } else {
                console.log("⚠️ Pas de propriété associée à ce contrat");
              }
            } else {
              console.log("⚠️ Relation contrat non trouvée");
            }
          } else {
            console.log("⚠️ Pas de relation_id associé à cette facture");
          }
        } catch (propertyError) {
          console.error(`❌ Erreur lors de la récupération des informations de propriété: ${propertyError}`);
          propertyInfo = null;
        }

        // Construire l'objet facture complet
        const factureComplete = {
          ...facture,
          conseiller: user ? {
            prenom: user.prenom || "",
            nom: user.nom || ""
          } : { prenom: "", nom: "" },
          propriete: propertyInfo
        };
        
        facturesCompletes.push(factureComplete);
        console.log(`✅ Facture ID: ${facture.id} traitée avec succès`);
      } catch (factureError) {
        console.error(`❌ Erreur lors du traitement de la facture ID ${facture.id}: ${factureError}`);
        // Continuer avec la facture suivante
      }
    }

    console.log(`✅ Traitement terminé pour ${facturesCompletes.length} factures`);
    return NextResponse.json(facturesCompletes, { status: 200 });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des factures :", error);
    // Afficher plus de détails sur l'erreur
    if (error instanceof Error) {
      console.error("Message d'erreur:", error.message);
      console.error("Stack trace:", error.stack);
    }
    return NextResponse.json(
      { error: "Erreur interne du serveur.", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
