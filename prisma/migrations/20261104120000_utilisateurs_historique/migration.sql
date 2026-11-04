-- Journal des modifications de `utilisateurs`.
--
-- Le taux de TVA de Lory LAMATY est passé de 8,5 % à 20 % en production entre le 07/10 et le
-- 03/11/2026 sans que rien ne permette de dire quand ni par qui : `utilisateurs.updated_at`
-- n'est pas tenu à jour automatiquement et aucune trace n'existait. Le trigger consigne
-- désormais chaque champ modifié, quelle qu'en soit l'origine : app, cron, SQL manuel.
--
-- Une ligne par champ modifié. L'auteur et la source sont posés par l'app en réglages de
-- session (`set_config(..., true)`, limités à la transaction) juste avant d'écrire ; une
-- source nulle désigne donc une écriture qui n'est pas passée par l'app (SQL, script).
--
-- Exclus du suivi : `updated_at` (bruit) et `chiffre_affaires` (cache recalculé par la synchro
-- des contrats, l'historique fait foi dans `historique_ca_annuel`). Le mot de passe est tracé
-- sans ses valeurs : on garde le fait qu'il a changé, jamais le hash.

-- CreateTable
CREATE TABLE "utilisateurs_historique" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER NOT NULL,
    "operation" VARCHAR(10) NOT NULL,
    "champ" VARCHAR(60),
    "avant" TEXT,
    "apres" TEXT,
    "auteur_id" INTEGER,
    "source" VARCHAR(100),

    CONSTRAINT "utilisateurs_historique_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "utilisateurs_historique_user_id_created_at_idx" ON "utilisateurs_historique"("user_id", "created_at");

-- Trigger
CREATE OR REPLACE FUNCTION "utilisateurs_historique_fn"() RETURNS trigger AS $$
DECLARE
    v_auteur INTEGER := NULLIF(current_setting('app.utilisateur_auteur', true), '')::INTEGER;
    v_source VARCHAR(100) := NULLIF(current_setting('app.utilisateur_source', true), '');
    v_ancien JSONB;
    v_nouveau JSONB;
    v_champ TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO "utilisateurs_historique" ("user_id", "operation", "auteur_id", "source")
        VALUES (NEW."id", 'INSERT', v_auteur, v_source);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        v_ancien := to_jsonb(OLD);
        v_nouveau := to_jsonb(NEW);
        FOR v_champ IN
            SELECT "key" FROM jsonb_each(v_nouveau)
            WHERE "key" NOT IN ('updated_at', 'chiffre_affaires')
        LOOP
            IF (v_ancien -> v_champ) IS DISTINCT FROM (v_nouveau -> v_champ) THEN
                INSERT INTO "utilisateurs_historique"
                    ("user_id", "operation", "champ", "avant", "apres", "auteur_id", "source")
                VALUES (
                    NEW."id", 'UPDATE', v_champ,
                    CASE WHEN v_champ = 'motDePasse' THEN NULL ELSE v_ancien ->> v_champ END,
                    CASE WHEN v_champ = 'motDePasse' THEN NULL ELSE v_nouveau ->> v_champ END,
                    v_auteur, v_source
                );
            END IF;
        END LOOP;
        RETURN NEW;
    ELSE
        INSERT INTO "utilisateurs_historique" ("user_id", "operation", "auteur_id", "source")
        VALUES (OLD."id", 'DELETE', v_auteur, v_source);
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "utilisateurs_historique_trigger"
    AFTER INSERT OR UPDATE OR DELETE ON "utilisateurs"
    FOR EACH ROW EXECUTE FUNCTION "utilisateurs_historique_fn"();
