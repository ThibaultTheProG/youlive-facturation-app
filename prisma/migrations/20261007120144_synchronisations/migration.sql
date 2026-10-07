-- CreateTable
CREATE TABLE "synchronisations" (
    "id" SERIAL NOT NULL,
    "type" VARCHAR(30) NOT NULL,
    "declencheur" VARCHAR(10) NOT NULL,
    "auteur_id" INTEGER,
    "debut" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fin" TIMESTAMP(6),
    "statut" VARCHAR(20) NOT NULL,
    "resume" JSONB,
    "erreur" TEXT,

    CONSTRAINT "synchronisations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_synchronisations_type_debut" ON "synchronisations"("type", "debut" DESC);

-- AddForeignKey
ALTER TABLE "synchronisations" ADD CONSTRAINT "synchronisations_auteur_id_fkey" FOREIGN KEY ("auteur_id") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
