-- Montants de `factures` en décimal exact.
--
-- `retrocession` (la rétrocession HT, montant principal de la facture) était un `DOUBLE PRECISION` :
-- les autres montants de la table (`montant_honoraires`, `montant_tva`) sont en `DECIMAL(10,2)`,
-- et un flottant ne représente pas exactement les centimes. `apporteur_amount` était un `INTEGER` :
-- un apporteur à 1 234,56 € était tronqué à l'euro.
--
-- Arrondi à 2 décimales à la conversion. Au 23/11/2026, une seule valeur en avait davantage
-- (facture 12727, n° 001/07 : 8 456,2434 → 8 456,24), déjà affichée arrondie partout.
-- Les entiers de `apporteur_amount` passent sans perte.

-- AlterTable
ALTER TABLE "factures"
  ALTER COLUMN "retrocession" SET DATA TYPE DECIMAL(10,2) USING round("retrocession"::numeric, 2),
  ALTER COLUMN "apporteur_amount" SET DATA TYPE DECIMAL(10,2);
