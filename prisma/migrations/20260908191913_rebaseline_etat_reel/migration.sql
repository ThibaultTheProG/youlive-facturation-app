-- MIGRATION DE REBASELINAGE — DESCRIPTIVE, JAMAIS EXÉCUTÉE.
--
-- L'historique prisma/migrations s'arrêtait au 12/03/2025 tandis que la base
-- continuait d'évoluer par `db push`. Ce fichier comble exactement cet écart :
-- il décrit le chemin « dernière migration de 2025 » → « état réel de la base ».
--
-- Il a été marqué appliqué sur Preproduction ET Production par
-- `prisma migrate resolve --applied`, qui n'insère qu'une ligne dans
-- `_prisma_migrations` et n'émet aucun DDL. Les objets ci-dessous EXISTAIENT
-- DÉJÀ quand cette migration a été créée.
--
-- NE JAMAIS EXÉCUTER CE FICHIER contre une base existante. Il échouerait dès
-- l'ADD COLUMN "idrelationapimo" INTEGER NOT NULL, posé sans DEFAULT sur une
-- table peuplée. Il n'a de sens que rejoué depuis zéro, sur une base vide.
--
-- Généré par `prisma migrate diff --from-migrations --to-schema` contre une
-- shadow database jetable, le 08/09/2026.

-- DropIndex
DROP INDEX "factures_unique_constraint";

-- DropIndex
DROP INDEX "unique_contrat_user";

-- AlterTable
ALTER TABLE "contrats" DROP COLUMN "price",
DROP COLUMN "price_net";

-- AlterTable
ALTER TABLE "factures" ADD COLUMN     "added_at" TIMESTAMP(6),
ADD COLUMN     "apply_tva" BOOLEAN,
ADD COLUMN     "date_paiement" TIMESTAMP(6),
ADD COLUMN     "montant_honoraires" DECIMAL(10,2),
ADD COLUMN     "montant_tva" DECIMAL(10,2),
ADD COLUMN     "motif" VARCHAR(500),
ADD COLUMN     "statut_envoi" VARCHAR(50) DEFAULT 'non envoyée',
ADD COLUMN     "taux_retrocession" DECIMAL(5,2),
ADD COLUMN     "taux_tva" DECIMAL(5,2),
ADD COLUMN     "tranche" VARCHAR(20);

-- AlterTable
ALTER TABLE "relations_contrats" ADD COLUMN     "idrelationapimo" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "utilisateurs" ADD COLUMN     "actif" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "adresse_facture" VARCHAR(255),
ADD COLUMN     "nom_societe_facture" VARCHAR(255),
ADD COLUMN     "siren_facture" VARCHAR(255),
ADD COLUMN     "taux_tva" DECIMAL(5,2);

-- CreateTable
CREATE TABLE "historique_ca_annuel" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "annee" INTEGER NOT NULL,
    "chiffre_affaires" DECIMAL(10,2) NOT NULL,
    "retrocession_finale" DECIMAL(5,2) NOT NULL,
    "typecontrat" VARCHAR(100),
    "auto_parrain" VARCHAR(3),
    "date_cloture" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historique_ca_annuel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_historique_ca_user_id" ON "historique_ca_annuel"("user_id");

-- CreateIndex
CREATE INDEX "idx_historique_ca_annee" ON "historique_ca_annuel"("annee");

-- CreateIndex
CREATE INDEX "idx_historique_ca_date_cloture" ON "historique_ca_annuel"("date_cloture");

-- CreateIndex
CREATE UNIQUE INDEX "unique_user_annee" ON "historique_ca_annuel"("user_id", "annee");

-- CreateIndex
CREATE INDEX "idx_factures_created_at" ON "factures"("created_at");

-- CreateIndex
CREATE INDEX "idx_factures_added_at" ON "factures"("added_at");

-- CreateIndex
CREATE INDEX "idx_factures_user_id" ON "factures"("user_id");

-- CreateIndex
CREATE INDEX "idx_factures_type" ON "factures"("type");

-- CreateIndex
CREATE INDEX "idx_factures_statut_paiement" ON "factures"("statut_paiement");

-- CreateIndex
CREATE INDEX "idx_factures_statut_envoi" ON "factures"("statut_envoi");

-- CreateIndex
CREATE UNIQUE INDEX "factures_unique_constraint" ON "factures"("relation_id", "type", "user_id", "tranche");

-- CreateIndex
CREATE UNIQUE INDEX "unique_idrelationapimo" ON "relations_contrats"("idrelationapimo");

-- AddForeignKey
ALTER TABLE "historique_ca_annuel" ADD CONSTRAINT "historique_ca_annuel_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

