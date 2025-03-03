/*
  Warnings:

  - You are about to drop the column `filleul_id` on the `parrainages` table. All the data in the column will be lost.
  - You are about to drop the column `niveau` on the `parrainages` table. All the data in the column will be lost.
  - You are about to drop the column `parrain_id` on the `parrainages` table. All the data in the column will be lost.
  - You are about to drop the column `prenom_filleul` on the `parrainages` table. All the data in the column will be lost.
  - You are about to drop the column `prenom_parrain` on the `parrainages` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[niveau1,niveau2,niveau3]` on the table `parrainages` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `user_id` to the `parrainages` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "unique_parrainage";

-- AlterTable
ALTER TABLE "parrainages" DROP COLUMN "filleul_id",
DROP COLUMN "niveau",
DROP COLUMN "parrain_id",
DROP COLUMN "prenom_filleul",
DROP COLUMN "prenom_parrain",
ADD COLUMN     "niveau1" INTEGER,
ADD COLUMN     "niveau2" INTEGER,
ADD COLUMN     "niveau3" INTEGER,
ADD COLUMN     "user_id" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "unique_parrainage" ON "parrainages"("niveau1", "niveau2", "niveau3");

-- AddForeignKey
ALTER TABLE "parrainages" ADD CONSTRAINT "parrainages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
