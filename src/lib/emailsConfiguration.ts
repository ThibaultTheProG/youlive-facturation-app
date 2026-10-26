import prisma from "@/lib/db";
import { emailsAdminFactures, emailsCopieClub99 } from "@/lib/environnement";
import type {
  DestinataireEmail,
  EvenementEmail,
  ModeDestinataire,
} from "@/lib/emailsEvenements";

/**
 * Adresses associées par l'admin aux emails (`/admin/emails`). C'est ici, et
 * non dans `environnement.ts`, que se lit la liste d'un email : la lecture
 * demande la base. Le déroutage hors production reste, lui, l'affaire de
 * `destinataires()` / `sujet()` : leur passer le résultat de `adressesPour`.
 *
 * Repli : tant qu'aucune adresse n'est enregistrée pour un couple
 * (événement, mode) qui avait une variable d'environnement, la variable reste
 * en vigueur. Le déploiement ne change donc rien à ce qui part, et l'admin
 * reprend la main en ajoutant une première adresse.
 */

const REPLI: Partial<Record<string, () => string[]>> = {
  "facture_admin:a": emailsAdminFactures,
  "club99:cc": emailsCopieClub99,
};

/** Adresses de repli (variables d'environnement) pour un couple, si elles existent. */
export function adressesParDefaut(
  evenement: EvenementEmail,
  mode: ModeDestinataire
): string[] | null {
  return REPLI[`${evenement}:${mode}`]?.() ?? null;
}

/**
 * Le cron de factures envoie un email par facture : relire la table à chaque
 * fois serait une requête par élément. Quinze secondes de cache suffisent à
 * l'éviter, et une modification faite par l'admin est vue aussitôt par
 * l'instance qui l'a reçue (`invalider`), au plus quinze secondes plus tard
 * par les autres.
 */
const DUREE_CACHE_MS = 15_000;
let cache: { lignes: DestinataireEmail[]; expire: number } | null = null;

export function invalider() {
  cache = null;
}

export async function lireTout(): Promise<DestinataireEmail[]> {
  if (cache && cache.expire > Date.now()) return cache.lignes;

  const lignes = (await prisma.emails_destinataires.findMany({
    select: { id: true, evenement: true, mode: true, adresse: true },
    orderBy: [{ evenement: "asc" }, { mode: "asc" }, { adresse: "asc" }],
  })) as DestinataireEmail[];

  cache = { lignes, expire: Date.now() + DUREE_CACHE_MS };
  return lignes;
}

/**
 * Adresses à joindre à un email pour un événement et un mode. Ne rend jamais
 * d'erreur : si la base est injoignable, mieux vaut un email sans la copie que
 * pas d'email — le repli d'environnement s'applique alors, comme si la liste
 * était vide.
 */
export async function adressesPour(
  evenement: EvenementEmail,
  mode: ModeDestinataire
): Promise<string[]> {
  try {
    const choisies = (await lireTout())
      .filter((ligne) => ligne.evenement === evenement && ligne.mode === mode)
      .map((ligne) => ligne.adresse);
    if (choisies.length > 0) return choisies;
  } catch (error) {
    console.error("Lecture des destinataires d'email impossible :", error);
  }
  return adressesParDefaut(evenement, mode) ?? [];
}
