import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/apiAuth";

/**
 * Annule un avoir / ajustement non envoyé, sans le remplacer.
 *
 * Même principe que `/remplacer` : un document qui n'a jamais quitté
 * l'application n'a pas été émis, il s'annule sans contre-écriture. Il reste
 * en base, marqué annulé (`en_vigueur` NULL, `annulee_le`), et disparaît de
 * l'espace du conseiller. S'il faut le refaire — autre montant, autre
 * émetteur —, on en crée un nouveau depuis le suivi.
 *
 * Réservé au type `avoir` : une commission ou un recrutement annulé sans
 * remplaçant ne serait jamais recréé par le cron, qui compte les annulées
 * comme traitées. Ceux-là passent par `/remplacer`.
 */
export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/factures/[id]/annuler">
) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const factureId = Number((await ctx.params).id);
  if (!Number.isInteger(factureId) || factureId <= 0) {
    return NextResponse.json({ error: "ID de facture invalide" }, { status: 400 });
  }

  try {
    const avoir = await prisma.factures.findUnique({
      where: { id: factureId },
      select: { type: true, en_vigueur: true, statut_envoi: true, statut_paiement: true },
    });

    if (!avoir) return refus("Facture introuvable", 404);
    if (avoir.en_vigueur !== true) return refus("Ce document est déjà annulé", 409);
    if (avoir.type !== "avoir") {
      return refus(
        "Seuls les avoirs et ajustements s'annulent ici ; une commission ou un recrutement non envoyé passe par « Annuler et remplacer »",
        409
      );
    }
    if (avoir.statut_envoi === "envoyée") {
      return refus("Ce document a été envoyé : il se corrige par un nouveau document", 409);
    }
    if (avoir.statut_paiement === "payé") {
      return refus("Ce document est payé : il se corrige par un nouveau document", 409);
    }

    const maintenant = new Date();

    // Le filtre sur `en_vigueur` écarte un double clic : le second ne trouve
    // plus rien.
    const annule = await prisma.factures.updateMany({
      where: { id: factureId, en_vigueur: true },
      data: { en_vigueur: null, annulee_le: maintenant, updated_at: maintenant },
    });
    if (annule.count === 0) return refus("Ce document est déjà annulé", 409);

    return NextResponse.json({ message: "Document annulé" }, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de l'annulation de l'avoir :", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { error: `Erreur base de données (${error.code})` },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}

const refus = (error: string, status: number) => NextResponse.json({ error }, { status });
