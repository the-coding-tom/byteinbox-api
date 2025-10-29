/*
  Warnings:

  - A unique constraint covering the columns `[reference]` on the table `api_keys` will be added. If there are existing duplicate values, this will fail.
  - The required column `reference` was added to the `api_keys` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "api_keys" ADD COLUMN     "reference" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_reference_key" ON "api_keys"("reference");
