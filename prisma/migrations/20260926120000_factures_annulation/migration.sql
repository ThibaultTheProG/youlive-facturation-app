-- Annulation d'une facture non envoyée, et son remplacement.
--
-- `en_vigueur` vaut `true` pour une facture active, `NULL` pour une facture
-- annulée — jamais `false`. Il entre dans `factures_unique_constraint` : les
-- NULL étant distincts en PostgreSQL, une facture annulée libère sa place et
-- sa remplaçante peut porter les mêmes (relation_id, type, user_id, tranche),
-- tandis que deux factures actives restent impossibles. Prisma ne sait pas
-- écrire d'index unique partiel ; ce détour garde le schéma sans dérive.
--
-- Les deux contraintes CHECK sont invisibles pour Prisma (il n'introspecte pas
-- les CHECK) et ne provoquent donc aucune dérive.

-- AlterTable : les lignes existantes prennent `en_vigueur = true` par défaut.
ALTER TABLE "factures" ADD COLUMN     "annulee_le" TIMESTAMP(6),
ADD COLUMN     "en_vigueur" BOOLEAN DEFAULT true,
ADD COLUMN     "remplace_id" INTEGER;

ALTER TABLE "factures" ADD CONSTRAINT "factures_en_vigueur_jamais_false"
  CHECK ("en_vigueur" IS NULL OR "en_vigueur");
ALTER TABLE "factures" ADD CONSTRAINT "factures_annulation_coherente"
  CHECK (("en_vigueur" IS NULL) = ("annulee_le" IS NOT NULL));

-- DropIndex / CreateIndex : la contrainte d'unicité s'étend à `en_vigueur`.
DROP INDEX "factures_unique_constraint";
CREATE UNIQUE INDEX "factures_unique_constraint" ON "factures"("relation_id", "type", "user_id", "tranche", "en_vigueur");

-- CreateIndex
CREATE UNIQUE INDEX "factures_remplace_id_key" ON "factures"("remplace_id");

-- AddForeignKey
ALTER TABLE "factures" ADD CONSTRAINT "fk_factures_remplace_id" FOREIGN KEY ("remplace_id") REFERENCES "factures"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
