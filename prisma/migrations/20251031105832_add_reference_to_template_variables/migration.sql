/*
  Warnings:

  - A unique constraint covering the columns `[reference]` on the table `template_variables` will be added. If there are existing duplicate values, this will fail.
  - The required column `reference` was added to the `template_variables` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "template_variables" ADD COLUMN     "reference" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "template_variables_reference_key" ON "template_variables"("reference");
