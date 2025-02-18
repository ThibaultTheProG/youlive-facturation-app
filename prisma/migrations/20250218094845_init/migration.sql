-- CreateTable
CREATE TABLE "contacts" (
    "id" SERIAL NOT NULL,
    "contact_apimo_id" INTEGER NOT NULL,
    "prenom" VARCHAR(255),
    "nom" VARCHAR(255),
    "email" VARCHAR(255),
    "mobile" VARCHAR(255),
    "adresse" VARCHAR(255),
    "ville" VARCHAR(255),
    "cp" VARCHAR(255),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts_contrats" (
    "id" SERIAL NOT NULL,
    "contrat_id" INTEGER,
    "contact_id" INTEGER NOT NULL,
    "type" INTEGER NOT NULL,

    CONSTRAINT "contacts_contrats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contrats" (
    "id" SERIAL NOT NULL,
    "idcontratapimo" INTEGER NOT NULL,
    "statut" VARCHAR(120),
    "property_id" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "price_net" DECIMAL(10,2) NOT NULL,
    "honoraires" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "date_signature" TIMESTAMP(6),

    CONSTRAINT "contrats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "factures" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "type" VARCHAR(50),
    "retrocession" DOUBLE PRECISION,
    "statut_paiement" VARCHAR(50),
    "created_at" TIMESTAMP(6),
    "updated_at" TIMESTAMP(6),
    "relation_id" INTEGER,
    "numero" VARCHAR(255),

    CONSTRAINT "factures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parrainages" (
    "id" SERIAL NOT NULL,
    "filleul_id" INTEGER NOT NULL,
    "parrain_id" INTEGER NOT NULL,
    "niveau" SMALLINT NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "prenom_parrain" CHAR(250),
    "prenom_filleul" CHAR(250),

    CONSTRAINT "parrainages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property" (
    "id" SERIAL NOT NULL,
    "adresse" VARCHAR(120),
    "numero_mandat" CHAR(200),
    "contrat_id" INTEGER NOT NULL,
    "create_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "update_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relations_contrats" (
    "id" SERIAL NOT NULL,
    "contrat_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "honoraires_agent" DECIMAL(10,2),
    "vat" DECIMAL(10,2),
    "vat_rate" DECIMAL(5,2),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contrats_utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "utilisateurs" (
    "id" SERIAL NOT NULL,
    "motDePasse" CHAR(60),
    "prenom" VARCHAR(50),
    "nom" VARCHAR(50),
    "email" VARCHAR(255),
    "telephone" VARCHAR(60),
    "adresse" VARCHAR(255),
    "role" VARCHAR(50),
    "created_at" TIMESTAMP(6),
    "updated_at" TIMESTAMP(6),
    "idapimo" INTEGER NOT NULL,
    "tva" BOOLEAN,
    "typecontrat" VARCHAR(100),
    "siren" VARCHAR(255),
    "chiffre_affaires" DECIMAL(10,2),
    "retrocession" DECIMAL(5,2),
    "parrain_id" INTEGER,
    "auto_parrain" VARCHAR(3) DEFAULT 'non',
    "mobile" VARCHAR(60),

    CONSTRAINT "utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contact_apimo_id" ON "contacts"("contact_apimo_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_contrat_id_contact_id" ON "contacts_contrats"("contrat_id", "contact_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_idcontratapimo" ON "contrats"("idcontratapimo");

-- CreateIndex
CREATE UNIQUE INDEX "factures_unique_constraint" ON "factures"("relation_id", "type", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_parrainage" ON "parrainages"("filleul_id", "parrain_id", "niveau");

-- CreateIndex
CREATE UNIQUE INDEX "unique_id_contrat" ON "property"("contrat_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_contrat_user" ON "relations_contrats"("contrat_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "idapimo_unique" ON "utilisateurs"("idapimo");

-- AddForeignKey
ALTER TABLE "contacts_contrats" ADD CONSTRAINT "contacts_contrats_contrat_id_fkey" FOREIGN KEY ("contrat_id") REFERENCES "contrats"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "factures" ADD CONSTRAINT "fk_factures_relation_id" FOREIGN KEY ("relation_id") REFERENCES "relations_contrats"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "property" ADD CONSTRAINT "fk_property_contrat_id" FOREIGN KEY ("contrat_id") REFERENCES "contrats"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "relations_contrats" ADD CONSTRAINT "fk_contrat" FOREIGN KEY ("contrat_id") REFERENCES "contrats"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "relations_contrats" ADD CONSTRAINT "fk_utilisateur" FOREIGN KEY ("user_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "utilisateurs" ADD CONSTRAINT "fk_parrain_id" FOREIGN KEY ("parrain_id") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
