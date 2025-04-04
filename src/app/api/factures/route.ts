import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const searchTerm = searchParams.get('searchTerm') || '';
    const filterStatut = searchParams.get('filterStatut') || '';
    const filterType = searchParams.get('filterType') || '';
    const sortField = searchParams.get('sortField') || 'created_at';
    const sortDirection = searchParams.get('sortDirection') || 'desc';

    // Construire la condition de recherche
    const where: Prisma.facturesWhereInput = {
      AND: [
        // Condition de recherche par nom/prénom de conseiller
        searchTerm ? {
          OR: [
            { 
              utilisateurs: {
                prenom: { contains: searchTerm, mode: 'insensitive' as Prisma.QueryMode }
              }
            },
            { 
              utilisateurs: {
                nom: { contains: searchTerm, mode: 'insensitive' as Prisma.QueryMode }
              }
            }
          ]
        } : {},
        // Filtre par statut
        filterStatut ? { statut_paiement: filterStatut } : {},
        // Filtre par type
        filterType ? { type: filterType } : {}
      ]
    };

    // Récupérer le nombre total de factures filtrées
    const totalCount = await prisma.factures.count({ where });

    // Si le nombre total de pages est inférieur à la page demandée,
    // ajuster la page à 1
    const totalPages = Math.ceil(totalCount / pageSize);
    const adjustedPage = page > totalPages && totalPages > 0 ? 1 : page;
    const adjustedSkip = (adjustedPage - 1) * pageSize;

    // Construire l'ordre de tri
    const orderBy: Prisma.facturesOrderByWithRelationInput = {};
    if (sortField === 'conseiller') {
      orderBy.utilisateurs = { nom: sortDirection as Prisma.SortOrder };
    } else if (sortField === 'montant') {
      orderBy.retrocession = sortDirection as Prisma.SortOrder;
    } else {
      orderBy[sortField as keyof Prisma.facturesOrderByWithRelationInput] = sortDirection as Prisma.SortOrder;
    }

    // Récupérer les factures avec leurs relations en une seule requête
    const factures = await prisma.factures.findMany({
      where,
      skip: adjustedSkip,
      take: pageSize,
      include: {
        utilisateurs: {
          select: {
            prenom: true,
            nom: true
          }
        },
        relations_contrats: {
          include: {
            contrats: {
              include: {
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
      orderBy
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
      page: adjustedPage,
      pageSize,
      totalPages
    }, { status: 200 });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des factures :", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}
