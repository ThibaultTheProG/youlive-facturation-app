/*
  Warnings:

  - A unique constraint covering the columns `[user_id]` on the table `parrainages` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "unique_parrainage";

-- CreateIndex
CREATE UNIQUE INDEX "parrainages_user_id_key" ON "parrainages"("user_id");
