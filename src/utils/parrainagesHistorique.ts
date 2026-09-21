/**
 * Signature des écritures sur `parrainages` pour le journal `parrainages_historique`.
 *
 * Le journal est alimenté par un trigger PostgreSQL (migration
 * `20260921120000_parrainages_historique`) : toute écriture est tracée, même sans
 * passer par ici. Ce helper ne fait qu'y ajouter l'auteur et la source, posés en
 * réglages de session limités à la transaction (`set_config(..., true)`) — d'où
 * l'obligation d'écrire à l'intérieur de `fn`, avec le client `tx` fourni.
 */

import prisma from "@/lib/db";

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export async function avecAuteurParrainage<T>(
  auteurId: number | null,
  source: string,
  fn: (tx: Tx) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT set_config('app.parrainage_auteur', ${
      auteurId != null ? String(auteurId) : ""
    }, true), set_config('app.parrainage_source', ${source}, true)`;
    return fn(tx);
  });
}
