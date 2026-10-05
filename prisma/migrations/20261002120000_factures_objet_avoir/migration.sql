-- Nature des factures qu'un avoir / ajustement régularise : `commission` ou
-- `recrutement`. Un avoir sur recrutement s'établit au nom de la société de
-- facturation du conseiller (`nom_societe_facture`, `siren_facture`,
-- `adresse_facture`) et suit `tva_recrutement` — cas d'un recrutement facturé
-- par une société distincte du conseiller.
--
-- Nullable et sans défaut : les avoirs existants restent à NULL, lu comme
-- `commission` (en-tête au nom du conseiller, leur comportement jusqu'ici).

-- AlterTable
ALTER TABLE "factures" ADD COLUMN     "objet" VARCHAR(20);
