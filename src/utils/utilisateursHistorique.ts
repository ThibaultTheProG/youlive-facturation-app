/**
 * Signature des écritures sur `utilisateurs` pour le journal `utilisateurs_historique`.
 *
 * Le journal est alimenté par un trigger PostgreSQL (migration
 * `20261104120000_utilisateurs_historique`) : toute écriture est tracée, même sans passer par
 * ici. Ce helper ne fait qu'y ajouter l'auteur et la source, posés en réglages de session
 * limités à la transaction (`set_config(..., true)`) — d'où l'obligation d'écrire à l'intérieur
 * de `fn`, avec le client `tx` fourni.
 *
 * Une écriture sans source dans le journal est, par construction, une écriture hors de l'app
 * (SQL manuel, script). Toute nouvelle écriture sur `utilisateurs` passe donc par ici.
 */

import prisma from "@/lib/db";

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/** Sources posées par l'app. Le préfixe dit qui agit : `admin`, `conseiller`, `systeme`, `lien`. */
export const SOURCES_UTILISATEUR = {
  adminFiche: "admin:fiche",
  conseillerFiche: "conseiller:fiche",
  adminDesactivation: "admin:desactivation",
  conseillerMotDePasse: "conseiller:mot-de-passe",
  lienMotDePasse: "lien:mot-de-passe",
  synchroApimo: "systeme:synchro-apimo",
  recalculCA: "systeme:recalcul-ca",
  reinitialisationCA: "systeme:reinitialisation-ca",
} as const;

export async function avecAuteurUtilisateur<T>(
  auteurId: number | null,
  source: string,
  fn: (tx: Tx) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT set_config('app.utilisateur_auteur', ${
      auteurId != null ? String(auteurId) : ""
    }, true), set_config('app.utilisateur_source', ${source}, true)`;
    return fn(tx);
  }, { maxWait: 10000, timeout: 20000 });
}
