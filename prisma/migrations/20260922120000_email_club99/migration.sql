-- Marqueur d'envoi du mail « club des 99 % » : un envoi par (conseiller, année),
-- posé uniquement après un envoi réussi.
ALTER TABLE "historique_ca_annuel" ADD COLUMN "email_club99_envoye_le" TIMESTAMP(6);

-- Pas d'envoi rétroactif : les conseillers déjà au-dessus du seuil au déploiement
-- sont considérés comme félicités.
UPDATE "historique_ca_annuel" SET "email_club99_envoye_le" = now()
WHERE "chiffre_affaires" >= 70000;
