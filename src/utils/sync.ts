/**
 * Utilitaires communs aux routes de synchronisation nocturne (crons Vercel).
 *
 * Règle de conception à respecter dans toutes ces routes : ne jamais émettre
 * une requête Prisma par élément Apimo. Les volumes grandissent en continu et
 * une boucle séquentielle finit fatalement par dépasser `maxDuration` — c'est
 * ce qui a mis `/api/contrats` en 504 en août 2026. Le schéma à suivre est :
 * précharger l'état en quelques SELECT, calculer le diff en mémoire, puis
 * n'écrire que le delta via `runChunked`.
 */

import { round2 } from "./decoupageSeuil";

/**
 * Concurrence des écritures Prisma. Reste sous la taille du pool pg
 * (10 connexions par défaut) pour ne pas saturer les connexions.
 */
export const WRITE_CONCURRENCY = 5;

/** Exécute `fn` sur tous les items, par lots de `WRITE_CONCURRENCY`. */
export async function runChunked<T>(
  items: T[],
  fn: (item: T) => Promise<void>
): Promise<void> {
  for (let i = 0; i < items.length; i += WRITE_CONCURRENCY) {
    await Promise.all(items.slice(i, i + WRITE_CONCURRENCY).map(fn));
  }
}

/** Compare deux montants décimaux (Decimal Prisma / number / null). */
export function memeMontant(
  a: { toString(): string } | number | null | undefined,
  b: number
): boolean {
  if (a === null || a === undefined) return false;
  return round2(Number(a)) === round2(b);
}

/**
 * Compare une date stockée à une date Apimo au format "YYYY-MM-DD".
 *
 * Les colonnes de dates sont des `timestamp` **sans fuseau** : les comparer
 * avec `getTime()` fait diverger toutes les lignes selon le fuseau du process.
 * On compare donc uniquement le jour, en composantes UTC.
 */
export function memeJour(
  a: Date | null | undefined,
  dateApimo: string
): boolean {
  if (!a) return false;
  return a.toISOString().slice(0, 10) === dateApimo.slice(0, 10);
}

/**
 * Compare deux textes nullables. Les colonnes `CHAR(n)` sont complétées par des
 * espaces à la lecture : sans `trim`, la valeur diffère toujours de la source
 * et la ligne est réécrite à chaque exécution.
 */
export function memeTexte(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  return (a?.trim() ?? "") === (b?.trim() ?? "");
}
