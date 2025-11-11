/*
  Warnings:

  - A unique constraint covering the columns `[reference]` on the table `api_request_logs` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[reference]` on the table `domains` will be added. If there are existing duplicate values, this will fail.
  - The required column `reference` was added to the `api_request_logs` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `reference` was added to the `domains` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "api_request_logs" ADD COLUMN     "reference" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "domains" ADD COLUMN     "reference" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "api_request_logs_reference_key" ON "api_request_logs"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "domains_reference_key" ON "domains"("reference");
