/*
  Warnings:

  - A unique constraint covering the columns `[reference]` on the table `contacts` will be added. If there are existing duplicate values, this will fail.
  - The required column `reference` was added to the `contacts` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "contacts" ADD COLUMN     "reference" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "contacts_reference_key" ON "contacts"("reference");
