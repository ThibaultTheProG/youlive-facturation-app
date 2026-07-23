/**
 * Calcul des montants d'une facture (HT, apporteur, TVA, TTC).
 *
 * Source de vérité unique, extraite des composants PDF
 * (`src/app/factures/[id]/pdf/Facture*.tsx`) afin que le mail envoyé aux
 * administrateurs affiche exactement les mêmes montants que le PDF.
 *
 * Rappel métier : la TVA vient du profil applicatif du conseiller
 * (`utilisateurs.tva` / `utilisateurs.taux_tva`), surchargeable au niveau de la
 * facture (`apply_tva` / `taux_tva`), et JAMAIS du `vat_rate` remonté par Apimo.
 */

type Numérique = number | string | null | undefined;

export interface FactureMontantsInput {
  /** Montant HT de la rétrocession. Signé : négatif pour un avoir. */
  retrocession: Numérique;
  /** Honoraires agence — ancien champ, utilisé en repli. */
  honoraires_agent?: Numérique;
  /** Honoraires agence — champ courant. */
  montant_honoraires?: Numérique;
  /** Taux de rétrocession (commission) ou taux de parrainage (recrutement), en %. */
  taux_retrocession?: Numérique;
  apporteur?: string | null;
  apporteur_amount?: Numérique;
  apply_tva?: boolean | null;
  taux_tva?: Numérique;
  montant_tva?: Numérique;
}

export interface ConseillerMontantsInput {
  tva?: boolean | null;
  taux_tva?: Numérique;
}

export interface MontantsFacture {
  honorairesAgence: number;
  tauxRetrocession: number;
  /** Rétrocession HT avant déduction de l'apporteur d'affaires. */
  retrocessionHT: number;
  apporteurActif: boolean;
  apporteurAmount: number;
  /** Base HT réellement facturée (rétrocession moins apporteur). */
  totalHT: number;
  tvaActive: boolean;
  tauxTVA: number;
  montantTVA: number;
  montantTTC: number;
}

const toNumber = (valeur: Numérique): number => Number(valeur) || 0;

export function computeMontantsFacture(
  facture: FactureMontantsInput,
  conseiller: ConseillerMontantsInput
): MontantsFacture {
  const retrocessionHT = toNumber(facture.retrocession);

  // Honoraires agence : champs courants si présents, sinon repli sur l'ancien
  // champ avec un taux redérivé (factures antérieures aux tranches).
  const aChampsCourants =
    facture.montant_honoraires != null && facture.taux_retrocession != null;

  const honorairesAgence = aChampsCourants
    ? toNumber(facture.montant_honoraires)
    : toNumber(facture.honoraires_agent);

  const tauxRetrocession = aChampsCourants
    ? toNumber(facture.taux_retrocession)
    : honorairesAgence
    ? Math.round((retrocessionHT / honorairesAgence) * 100)
    : 0;

  const tvaActive = facture.apply_tva ?? conseiller.tva ?? false;
  const tauxTVA =
    facture.taux_tva != null
      ? Number(facture.taux_tva)
      : conseiller.taux_tva != null
      ? Number(conseiller.taux_tva)
      : 20;

  const apporteurActif = facture.apporteur === "oui";
  const apporteurAmount = apporteurActif ? toNumber(facture.apporteur_amount) : 0;
  const totalHT = retrocessionHT - apporteurAmount;

  let montantTVA = 0;
  if (tvaActive) {
    // Avec apporteur, la TVA est recalculée sur la base nette : le
    // `montant_tva` persisté porte sur la rétrocession avant déduction.
    montantTVA = apporteurActif
      ? Number(((totalHT * tauxTVA) / 100).toFixed(2))
      : facture.montant_tva != null
      ? Number(facture.montant_tva)
      : Number(((retrocessionHT * tauxTVA) / 100).toFixed(2));
  }

  return {
    honorairesAgence,
    tauxRetrocession,
    retrocessionHT,
    apporteurActif,
    apporteurAmount,
    totalHT,
    tvaActive,
    tauxTVA,
    montantTVA,
    montantTTC: totalHT + montantTVA,
  };
}
