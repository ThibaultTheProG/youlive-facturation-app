/**
 * Logique PURE et testable du découpage de commission au seuil de CA annuel.
 *
 * Ce module ne dépend d'AUCUN autre (ni Prisma, ni alias `@/…`, ni JSX) afin de
 * rester exécutable tel quel par le runner natif `node --test`. C'est la SOURCE
 * DE VÉRITÉ du barème de rétrocession : `calculs.ts` délègue ici.
 */

/** Seuil annuel de CA (€) au-delà duquel la rétrocession passe à 99 %. */
export const SEUIL_CA = 70000;

/**
 * Arrondit à 2 décimales en neutralisant les artefacts flottants
 * (ex. `103999.98000000001` → `103999.98`). À appliquer sur toute somme de CA
 * AVANT comparaison au seuil.
 */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Barème de rétrocession en fonction du type de contrat et du CA.
 * - "Offre Youlive"    : 70 % sous le seuil, 99 % au-dessus
 * - "Offre Découverte" : 60 % sous le seuil, 99 % au-dessus
 * - auto-parrainage "oui" : +6 %, plafonné à 99 %
 */
export function tauxRetrocession(
  typecontrat: string,
  chiffreAffaires: number,
  autoParrain?: string
): number {
  let retrocession = 0;

  switch (typecontrat) {
    case "Offre Youlive":
      retrocession = chiffreAffaires >= SEUIL_CA ? 99 : 70;
      break;
    case "Offre Découverte":
      retrocession = chiffreAffaires >= SEUIL_CA ? 99 : 60;
      break;
    default:
      retrocession = 0;
  }

  if (autoParrain === "oui") {
    retrocession += 6;
  }

  return Math.min(retrocession, 99);
}

export interface DecoupageResult {
  /** Honoraires de la tranche sous le seuil (peut être 0). */
  montantAvant: number;
  /** Taux appliqué à la tranche sous le seuil (0 si pas de tranche). */
  tauxAvant: number;
  /** Honoraires de la tranche au-dessus du seuil (peut être 0). */
  montantApres: number;
  /** Taux appliqué à la tranche au-dessus du seuil (0 si pas de tranche). */
  tauxApres: number;
}

/**
 * Découpe les honoraires d'un contrat en deux tranches (avant / après le seuil
 * de 70 000 € de CA annuel), avec le taux de rétrocession propre à chacune.
 *
 * Le découpage est CHRONOLOGIQUE : `caAvant` est le CA déjà acquis par le
 * conseiller sur l'année AVANT ce contrat. Toutes les sommes sont arrondies à
 * 2 décimales avant comparaison au seuil pour éviter les artefacts flottants.
 *
 * Fonction pure : aucun effet de bord, entièrement déterministe.
 */
export function decoupageSeuil(
  caAvant: number,
  honoraires: number,
  typecontrat: string,
  autoParrain?: string
): DecoupageResult {
  const caA = round2(caAvant);
  const newCA = round2(caA + honoraires);

  let montantAvant = 0;
  let montantApres = 0;

  if (caA < SEUIL_CA && newCA > SEUIL_CA) {
    // Ce contrat fait franchir le seuil : on découpe en deux tranches.
    montantAvant = round2(SEUIL_CA - caA);
    montantApres = round2(honoraires - montantAvant);
  } else if (caA >= SEUIL_CA) {
    // Déjà au-dessus du seuil : tout passe en tranche supérieure.
    montantApres = round2(honoraires);
  } else {
    // Reste sous le seuil : tout passe en tranche inférieure.
    montantAvant = round2(honoraires);
  }

  const tauxAvant =
    montantAvant > 0 ? tauxRetrocession(typecontrat, caA, autoParrain) : 0;
  const tauxApres =
    montantApres > 0 ? tauxRetrocession(typecontrat, SEUIL_CA, autoParrain) : 0;

  return { montantAvant, tauxAvant, montantApres, tauxApres };
}
