-- Adresses associées par l'admin aux emails envoyés par l'application, en
-- remplacement de FACTURES_ADMIN_EMAILS et CLUB99_EMAILS_COPIE (qui restent le
-- repli tant qu'une liste est vide). Table nouvelle, hors contrat avec l'avis
-- de valeur.

-- CreateTable
CREATE TABLE "emails_destinataires" (
    "id" SERIAL NOT NULL,
    "evenement" VARCHAR(30) NOT NULL,
    "mode" VARCHAR(2) NOT NULL,
    "adresse" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emails_destinataires_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "emails_destinataires_unique" ON "emails_destinataires"("evenement", "mode", "adresse");
