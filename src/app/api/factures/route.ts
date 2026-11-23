import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/apiAuth";

/** Colonnes triables du suivi des factures (`FacturesTable.tsx`). */
const TRIS_AUTORISES = [
  'conseiller',
  'montant',
  'numero_mandat',
  'date_signature',
  'statut_envoi',
  'date_paiement',
] as const;

/** Taille de page maximale, export Excel compris (809 factures au 23/11/2026). */
const TAILLE_PAGE_MAX = 10000;

function entierPositif(valeur: string | null, defaut: number): number {
  const n = Number.parseInt(valeur ?? '', 10);
  return Number.isFinite(n) && n > 0 ? n : defaut;
}

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const page = entierPositif(searchParams.get('page'), 1);
    // Plafonné : l'export Excel demande toutes les factures d'un coup (TAILLE_PAGE_MAX),
    // et vérifie lui-même qu'il a tout reçu (totalCount).
    const pageSize = Math.min(entierPositif(searchParams.get('pageSize'), 10), TAILLE_PAGE_MAX);
    const searchTerm = searchParams.get('searchTerm') || '';
    const filterStatut = searchParams.get('filterStatut') || '';
    const filterType = searchParams.get('filterType') || '';
    const filterStatutEnvoi = searchParams.get('filterStatutEnvoi') || '';
    // Liste fermée : une valeur inconnue passée telle quelle à Prisma donnait une 500.
    const sortFieldDemande = searchParams.get('sortField') ?? '';
    const sortField = (TRIS_AUTORISES as readonly string[]).includes(sortFieldDemande)
      ? sortFieldDemande
      : 'date_signature';
    const sortDirection: Prisma.SortOrder = searchParams.get('sortDirection') === 'asc' ? 'asc' : 'desc';

    // Construire la condition de recherche
    const where: Prisma.facturesWhereInput = {
      AND: [
        // Condition de recherche par nom/prénom de conseiller ou numéro de mandat
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
            },
            {
              relations_contrats: {
                contrats: {
                  property: {
                    numero_mandat: { contains: searchTerm, mode: 'insensitive' as Prisma.QueryMode }
                  }
                }
              }
            }
          ]
        } : {},
        // Filtre par statut. « annulée » n'est pas un statut de paiement : une
        // facture annulée garde le sien (« non payé »), il faut donc l'écarter
        // des autres filtres.
        filterStatut === 'annulée'
          ? { en_vigueur: null }
          : filterStatut ? { statut_paiement: filterStatut, en_vigueur: true } : {},
        // Filtre par type
        filterType ? { type: filterType } : {},
        // Filtre par statut d'envoi
        filterStatutEnvoi ? { statut_envoi: filterStatutEnvoi } : {}
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
      orderBy.utilisateurs = { nom: sortDirection };
    } else if (sortField === 'montant') {
      orderBy.retrocession = sortDirection;
    } else if (sortField === 'statut_envoi') {
      orderBy.statut_envoi = sortDirection;
    } else if (sortField === 'date_paiement') {
      orderBy.date_paiement = { sort: sortDirection, nulls: 'last' };
    } else if (sortField === 'numero_mandat') {
      orderBy.relations_contrats = {
        contrats: {
          property: {
            numero_mandat: { sort: sortDirection, nulls: 'last' }
          }
        }
      };
    } else {
      // date_signature, et le défaut
      orderBy.relations_contrats = {
        contrats: {
          // Sans `nulls: 'last'`, PostgreSQL place les NULL en premier en décroissant :
          // les factures sans signature masqueraient les dernières signées.
          date_signature: { sort: sortDirection, nulls: 'last' }
        }
      };
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
            nom: true,
            tva: true,
            taux_tva: true,
            tva_recrutement: true
          }
        },
        remplace: { select: { numero: true } },
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
    const facturesFormatees = factures.map(({ remplace, ...facture }) => ({
      ...facture,
      // Decimal → nombre : le JSON gardait un nombre quand la colonne était un Float.
      retrocession: facture.retrocession != null ? Number(facture.retrocession) : null,
      apporteur_amount: facture.apporteur_amount != null ? Number(facture.apporteur_amount) : null,
      annulee: facture.en_vigueur !== true,
      annulee_le: facture.annulee_le?.toISOString() ?? null,
      remplace: facture.remplace_id ? { id: facture.remplace_id, numero: remplace?.numero ?? null } : null,
      conseiller: {
        prenom: facture.utilisateurs?.prenom || "",
        nom: facture.utilisateurs?.nom || "",
        tva: facture.utilisateurs?.tva ?? false,
        taux_tva: facture.utilisateurs?.taux_tva ? Number(facture.utilisateurs.taux_tva) : null,
        tva_recrutement: facture.utilisateurs?.tva_recrutement ?? true
      },
      propriete: {
        numero_mandat: facture.relations_contrats?.contrats?.property?.numero_mandat || ""
      },
      date_signature: facture.relations_contrats?.contrats?.date_signature?.toISOString() || null,
      statut_envoi: facture.statut_envoi || "non envoyée"
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
