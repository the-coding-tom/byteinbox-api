/*
  Warnings:

  - A unique constraint covering the columns `[reference]` on the table `emails` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "emails" ADD COLUMN     "reference" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "emails_reference_key" ON "emails"("reference");
