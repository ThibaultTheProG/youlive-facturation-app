import { tauxRetrocession } from "./decoupageSeuil";

/**
 * Calcule le taux de rétrocession d'un conseiller.
 *
 * Conservé comme API publique (utilisé par les formulaires de paramètres et la
 * génération de factures) ; la logique du barème vit désormais dans
 * `decoupageSeuil.ts` (source de vérité, pure et testée).
 */
export const calculRetrocession = (
  typecontrat: string,
  chiffre_affaires: number,
  autoParrain?: string
): number => tauxRetrocession(typecontrat, chiffre_affaires, autoParrain);
