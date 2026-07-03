import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";
import { round2 } from "@/utils/decoupageSeuil";

/**
 * Création d'un avoir / ajustement « libre » (régularisation manuelle).
 *
 * Un avoir n'est PAS rattaché à une relation_contrat : il porte un conseiller,
 * un montant HT signé (positif = complément dû au conseiller / « facture
 * d'ajustement », négatif = trop-perçu à rembourser / « avoir »), une
 * désignation libre (motif) et une TVA calculée depuis le profil du conseiller
 * (utilisateurs.tva / taux_tva, fallback 20 %) — voir [[reference_tva_profil]].
 *
 * Il n'impacte NI historique_ca_annuel NI la rétrocession : c'est un document
 * de régularisation. Créé sans numéro et non envoyé — Tiphaine attribue le n°
 * et envoie depuis l'app via le flux existant.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      user_id,
      montant_ht,
      motif,
      apply_tva,
      taux_tva,
    }: {
      user_id?: number;
      montant_ht?: number | string;
      motif?: string;
      apply_tva?: boolean | null;
      taux_tva?: number | string | null;
    } = body;

    // Validation
    const userId = Number(user_id);
    if (!userId || Number.isNaN(userId)) {
      return NextResponse.json(
        { error: "Le conseiller (user_id) est requis" },
        { status: 400 }
      );
    }

    const montantHT = Number(montant_ht);
    if (montant_ht === undefined || montant_ht === null || montant_ht === "" || Number.isNaN(montantHT)) {
      return NextResponse.json(
        { error: "Le montant HT est requis et doit être un nombre" },
        { status: 400 }
      );
    }
    if (montantHT === 0) {
      return NextResponse.json(
        { error: "Le montant HT ne peut pas être nul" },
        { status: 400 }
      );
    }

    if (!motif || typeof motif !== "string" || motif.trim() === "") {
      return NextResponse.json(
        { error: "Le motif (désignation) est requis" },
        { status: 400 }
      );
    }

    const conseiller = await prisma.utilisateurs.findUnique({
      where: { id: userId },
      select: { id: true, tva: true, taux_tva: true },
    });

    if (!conseiller) {
      return NextResponse.json(
        { error: "Conseiller introuvable" },
        { status: 404 }
      );
    }

    // TVA : override éventuel sinon profil du conseiller, fallback 20 %
    const effectiveApply =
      apply_tva === undefined || apply_tva === null
        ? conseiller.tva ?? false
        : Boolean(apply_tva);

    const overrideTaux =
      taux_tva === undefined || taux_tva === null || taux_tva === ""
        ? null
        : Number(taux_tva);
    const effectiveTaux =
      overrideTaux ??
      (conseiller.taux_tva != null ? Number(conseiller.taux_tva) : 20);

    // Le montant TVA suit le signe du montant HT (avoir négatif => TVA négative)
    const montantHTArrondi = round2(montantHT);
    const montantTVA = effectiveApply
      ? round2((montantHTArrondi * effectiveTaux) / 100)
      : 0;

    const now = new Date();

    const facture = await prisma.factures.create({
      data: {
        type: "avoir",
        user_id: userId,
        relation_id: null,
        motif: motif.trim(),
        retrocession: montantHTArrondi,
        montant_honoraires: null,
        taux_retrocession: null,
        tranche: null,
        apply_tva: effectiveApply,
        taux_tva: effectiveTaux,
        montant_tva: montantTVA,
        statut_paiement: "non payé",
        statut_envoi: "non envoyée",
        apporteur: "non",
        numero: null,
        created_at: now,
        added_at: now,
        updated_at: now,
      },
      select: { id: true, type: true, retrocession: true, montant_tva: true },
    });

    return NextResponse.json(
      { message: "Avoir créé avec succès", facture },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur lors de la création de l'avoir :", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { error: `Erreur base de données (${error.code})` },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
