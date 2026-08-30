/**
 * Point d'entrée unique pour tout ce qui doit se comporter différemment selon
 * l'environnement de déploiement. Ne jamais relire `VERCEL_ENV` ailleurs, sur
 * le modèle de `devAuth.ts` : c'est ce qui garantit qu'un nouvel envoi d'email
 * ne peut pas oublier le garde-fou.
 *
 * `NODE_ENV` ne convient pas ici : Vercel le fixe à "production" sur *tous* les
 * déploiements, staging compris. Seul `VERCEL_ENV` distingue la production.
 */

/**
 * Vrai uniquement sur le déploiement de production Vercel.
 *
 * Le défaut est délibérément sûr : en local (`VERCEL_ENV` absent) comme sur
 * l'environnement `staging` (branche git `preprod`, base Neon Preproduction),
 * la fonction renvoie `false` et les emails sont déroutés. Il faut donc une
 * production explicite pour écrire à de vraies personnes.
 */
export function estProduction(): boolean {
  return process.env.VERCEL_ENV === "production";
}

/** Adresse recevant tout le courrier hors production. */
function adresseDeroutage(): string {
  return (
    process.env.EMAIL_REDIRECTION || "thibault.tuffin@youlive-immobilier.fr"
  );
}

/**
 * Destinataires effectifs d'un email.
 *
 * En production, la liste demandée, nettoyée et jointe. Partout ailleurs,
 * l'adresse de déroutage — quels que soient les destinataires demandés.
 *
 * @param voulus destinataires réels ; les valeurs vides sont ignorées
 */
export function destinataires(
  voulus: (string | null | undefined)[]
): string {
  if (!estProduction()) return adresseDeroutage();
  return voulus.filter(Boolean).join(", ");
}

/**
 * Sujet d'un email, préfixé hors production par les destinataires qui auraient
 * été servis en production. Sans cela, un email dérouté est indiscernable d'un
 * email correctement adressé, et on ne peut pas vérifier le routage en recette.
 */
export function sujet(
  sujetVoulu: string,
  voulus: (string | null | undefined)[]
): string {
  if (estProduction()) return sujetVoulu;
  const reels = voulus.filter(Boolean).join(", ") || "aucun destinataire";
  return `[${process.env.VERCEL_ENV || "local"} → ${reels}] ${sujetVoulu}`;
}

/**
 * Destinataires des notifications de facture adressées à l'administration.
 * `FACTURES_ADMIN_EMAILS` est une liste séparée par des virgules ; à défaut,
 * repli sur `SMTP_TO_EMAIL` seul.
 */
export function emailsAdminFactures(): string[] {
  const liste = process.env.FACTURES_ADMIN_EMAILS;
  if (liste) {
    return liste
      .split(",")
      .map((adresse) => adresse.trim())
      .filter(Boolean);
  }
  return [process.env.SMTP_TO_EMAIL].filter(Boolean) as string[];
}
