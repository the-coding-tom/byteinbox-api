/*
  Warnings:

  - A unique constraint covering the columns `[reference]` on the table `teams` will be added. If there are existing duplicate values, this will fail.
  - The required column `reference` was added to the `teams` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropIndex
DROP INDEX "public"."teams_slug_key";

-- AlterTable
ALTER TABLE "teams" ADD COLUMN     "reference" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "teams_reference_key" ON "teams"("reference");
