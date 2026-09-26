import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/apiAuth";
import { tvaParDefaut } from "@/utils/montantsFacture";
import { round2 } from "@/utils/decoupageSeuil";

/**
 * Annule une facture non envoyée et la remplace par une nouvelle.
 *
 * Une facture qui n'a jamais quitté l'application n'a pas été émise : on
 * l'annule sans avoir. Elle reste en base, marquée annulée (`en_vigueur`
 * NULL, `annulee_le`), et sa remplaçante reprend la même vente, le même
 * type, la même tranche et les mêmes montants HT. Seule la TVA est
 * recalculée, d'après le profil actuel du conseiller (`tvaParDefaut`) —
 * c'est le cas d'usage : une facture de recrutement créée avec une TVA
 * qui n'était pas due.
 *
 * Une facture envoyée ou payée ne passe pas par ici : elle a été émise,
 * elle s'annule par un avoir.
 */
export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/factures/[id]/remplacer">
) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const factureId = Number((await ctx.params).id);
  if (!Number.isInteger(factureId) || factureId <= 0) {
    return NextResponse.json({ error: "ID de facture invalide" }, { status: 400 });
  }

  try {
    const remplacante = await prisma.$transaction(async (tx) => {
      const origine = await tx.factures.findUnique({
        where: { id: factureId },
        include: {
          utilisateurs: { select: { tva: true, taux_tva: true, tva_recrutement: true } },
        },
      });

      if (!origine) throw new RefusRemplacement("Facture introuvable", 404);
      if (origine.en_vigueur !== true) {
        throw new RefusRemplacement("Cette facture est déjà annulée", 409);
      }
      if (origine.type !== "commission" && origine.type !== "recrutement") {
        throw new RefusRemplacement(
          "Seules les factures de commission et de recrutement se remplacent ; un avoir ou un ajustement se corrige par un nouveau document",
          409
        );
      }
      if (origine.statut_envoi === "envoyée") {
        throw new RefusRemplacement(
          "Cette facture a été envoyée : elle s'annule par un avoir",
          409
        );
      }
      if (origine.statut_paiement === "payé") {
        throw new RefusRemplacement(
          "Cette facture est payée : elle s'annule par un avoir",
          409
        );
      }

      const maintenant = new Date();

      // Annuler d'abord : la contrainte d'unicité n'admet qu'une facture
      // active par (relation, type, conseiller, tranche). Le filtre sur
      // `en_vigueur` écarte un double clic : le second ne trouve plus rien.
      const annulee = await tx.factures.updateMany({
        where: { id: origine.id, en_vigueur: true },
        data: { en_vigueur: null, annulee_le: maintenant, updated_at: maintenant },
      });
      if (annulee.count === 0) {
        throw new RefusRemplacement("Cette facture est déjà annulée", 409);
      }

      const conseiller = origine.utilisateurs ?? {};
      const applyTva = tvaParDefaut(origine.type, conseiller);
      const tauxTva = origine.utilisateurs?.taux_tva != null ? Number(origine.utilisateurs.taux_tva) : 20;
      const retrocession = origine.retrocession ?? 0;

      return tx.factures.create({
        data: {
          remplace_id: origine.id,
          relation_id: origine.relation_id,
          user_id: origine.user_id,
          type: origine.type,
          tranche: origine.tranche,
          retrocession,
          montant_honoraires: origine.montant_honoraires,
          taux_retrocession: origine.taux_retrocession,
          apporteur: origine.apporteur,
          apporteur_amount: origine.apporteur_amount,
          motif: origine.motif,
          apply_tva: applyTva,
          taux_tva: applyTva ? tauxTva : null,
          montant_tva: applyTva ? round2((retrocession * tauxTva) / 100) : 0,
          statut_paiement: "non payé",
          statut_envoi: "non envoyée",
          numero: null,
          created_at: maintenant,
          added_at: maintenant,
          updated_at: maintenant,
        },
        select: { id: true, type: true, retrocession: true, montant_tva: true },
      });
    });

    return NextResponse.json(
      { message: "Facture annulée et remplacée", facture: remplacante },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof RefusRemplacement) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Erreur lors du remplacement de la facture :", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { error: `Erreur base de données (${error.code})` },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}

class RefusRemplacement extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}
