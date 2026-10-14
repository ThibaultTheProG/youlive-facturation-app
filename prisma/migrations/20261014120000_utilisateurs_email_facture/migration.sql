-- Email imprimé en en-tête des factures de recrutement et des avoirs qui les
-- régularisent, aux côtés de `nom_societe_facture`, `siren_facture` et
-- `adresse_facture` — cas d'un recrutement facturé par une société dont
-- l'adresse mail n'est pas celle du conseiller (Maryline DELAHAYE / EASY RENT).
--
-- `email` reste l'identifiant de connexion, ici comme dans l'avis de valeur,
-- et le destinataire des notifications. Nullable et sans défaut : vide, les
-- factures continuent d'imprimer `email`. Colonne hors contrat avec l'avis de
-- valeur : l'ajouter est sans conséquence pour lui.

-- AlterTable
ALTER TABLE "utilisateurs" ADD COLUMN     "email_facture" VARCHAR(255);
