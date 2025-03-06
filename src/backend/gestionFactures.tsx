"use server";
import prisma from "../lib/db";
// Récupérer les factures qui sont dans la BDD
export async function getFactures(userId: number) {
  const result = await prisma.factures.findMany({
    where: {
      user_id: userId
    },
    select: {
      id: true,
      type: true,
      retrocession: true,
      statut_paiement: true,
      created_at: true,
      numero: true,
      apporteur: true,
      apporteur_amount: true,
      relations_contrats: {
        select: {
          honoraires_agent: true,
          contrats: {
            select: {
              date_signature: true,
              property: {
                select: {
                  numero_mandat: true
                }
              }
            }
          }
        }
      }
    }
  });

  return result.map(({ relations_contrats, retrocession, ...rest }) => ({
    ...rest,
    honoraires_agent: relations_contrats?.honoraires_agent?.toString() || "0",
    retrocession: retrocession?.toString() || "0",
    numero_mandat: relations_contrats?.contrats?.property?.numero_mandat || "",
    date_signature: relations_contrats?.contrats?.date_signature?.toISOString() || null
  }));
}


