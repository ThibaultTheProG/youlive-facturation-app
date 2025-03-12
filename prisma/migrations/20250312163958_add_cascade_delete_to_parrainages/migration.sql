-- DropForeignKey
ALTER TABLE "parrainages" DROP CONSTRAINT "parrainages_user_id_fkey";

-- AddForeignKey
ALTER TABLE "parrainages" ADD CONSTRAINT "parrainages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
