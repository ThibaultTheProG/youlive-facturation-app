-- Journal des modifications de `parrainages`.
--
-- Des filleuls se sont retrouvés détachés de leur parrain sans que rien ne permette
-- de dire quand ni par qui (cf. PUT /api/conseillers avant le 25/08/2026). Le trigger
-- trace désormais toute écriture sur la table, quelle qu'en soit l'origine : app,
-- cron, désactivation, SQL manuel.
--
-- L'auteur et la source sont facultatifs : l'app les pose en réglages de session
-- (`set_config(..., true)`, donc limités à la transaction) juste avant d'écrire.

-- CreateTable
CREATE TABLE "parrainages_historique" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "operation" VARCHAR(10) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "niveau1_avant" INTEGER,
    "niveau2_avant" INTEGER,
    "niveau3_avant" INTEGER,
    "niveau1_apres" INTEGER,
    "niveau2_apres" INTEGER,
    "niveau3_apres" INTEGER,
    "auteur_id" INTEGER,
    "source" VARCHAR(100),

    CONSTRAINT "parrainages_historique_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "parrainages_historique_user_id_created_at_idx" ON "parrainages_historique"("user_id", "created_at");

-- Trigger
CREATE OR REPLACE FUNCTION "parrainages_historique_fn"() RETURNS trigger AS $$
DECLARE
    v_auteur INTEGER := NULLIF(current_setting('app.parrainage_auteur', true), '')::INTEGER;
    v_source VARCHAR(100) := NULLIF(current_setting('app.parrainage_source', true), '');
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO "parrainages_historique"
            ("operation", "user_id", "niveau1_apres", "niveau2_apres", "niveau3_apres", "auteur_id", "source")
        VALUES ('INSERT', NEW."user_id", NEW."niveau1", NEW."niveau2", NEW."niveau3", v_auteur, v_source);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Un enregistrement de fiche qui ne change rien aux parrains ne pollue pas le journal.
        IF (OLD."niveau1", OLD."niveau2", OLD."niveau3", OLD."user_id")
           IS DISTINCT FROM (NEW."niveau1", NEW."niveau2", NEW."niveau3", NEW."user_id") THEN
            INSERT INTO "parrainages_historique"
                ("operation", "user_id", "niveau1_avant", "niveau2_avant", "niveau3_avant",
                 "niveau1_apres", "niveau2_apres", "niveau3_apres", "auteur_id", "source")
            VALUES ('UPDATE', NEW."user_id", OLD."niveau1", OLD."niveau2", OLD."niveau3",
                    NEW."niveau1", NEW."niveau2", NEW."niveau3", v_auteur, v_source);
        END IF;
        RETURN NEW;
    ELSE
        INSERT INTO "parrainages_historique"
            ("operation", "user_id", "niveau1_avant", "niveau2_avant", "niveau3_avant", "auteur_id", "source")
        VALUES ('DELETE', OLD."user_id", OLD."niveau1", OLD."niveau2", OLD."niveau3", v_auteur, v_source);
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "parrainages_historique_trigger"
    AFTER INSERT OR UPDATE OR DELETE ON "parrainages"
    FOR EACH ROW EXECUTE FUNCTION "parrainages_historique_fn"();
