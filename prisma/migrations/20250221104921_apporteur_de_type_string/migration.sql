/*
  Warnings:

  - Made the column `apporteur` on table `factures` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "factures" ALTER COLUMN "apporteur" SET NOT NULL,
ALTER COLUMN "apporteur" SET DEFAULT 'non',
ALTER COLUMN "apporteur" SET DATA TYPE TEXT;
