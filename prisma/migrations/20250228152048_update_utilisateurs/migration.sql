/*
  Warnings:

  - You are about to drop the column `parrain_id` on the `utilisateurs` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "utilisateurs" DROP CONSTRAINT "fk_parrain_id";

-- AlterTable
ALTER TABLE "utilisateurs" DROP COLUMN "parrain_id";
