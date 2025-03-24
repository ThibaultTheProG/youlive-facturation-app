import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const skip = (page - 1) * pageSize;

    // Récupérer le nombre total de factures
    const totalCount = await prisma.factures.count();

    // Récupérer les factures avec leurs relations en une seule requête
    const factures = await prisma.factures.findMany({
      skip,
      take: pageSize,
      select: {
        id: true,
        user_id: true,
        type: true,
        retrocession: true,
        statut_paiement: true,
        created_at: true,
        numero: true,
        relation_id: true,
        utilisateurs: {
          select: {
            prenom: true,
            nom: true
          }
        },
        relations_contrats: {
          select: {
            contrats: {
              select: {
                property: {
                  select: {
                    numero_mandat: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Transformer les données pour le format attendu
    const facturesFormatees = factures.map(facture => ({
      ...facture,
      conseiller: {
        prenom: facture.utilisateurs?.prenom || "",
        nom: facture.utilisateurs?.nom || ""
      },
      propriete: {
        numero_mandat: facture.relations_contrats?.contrats?.property?.numero_mandat || ""
      }
    }));

    return NextResponse.json({
      factures: facturesFormatees,
      totalCount,
      page,
      pageSize
    }, { status: 200 });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des factures :", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}
