-- AddForeignKey
ALTER TABLE "factures" ADD CONSTRAINT "factures_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
