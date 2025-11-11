/*
  Warnings:

  - You are about to drop the column `record` on the `dns_records` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[reference]` on the table `webhooks` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `record_type` to the `dns_records` table without a default value. This is not possible if the table is not empty.
  - The required column `reference` was added to the `webhooks` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "dns_records" DROP COLUMN "record",
ADD COLUMN     "record_type" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "domains" ALTER COLUMN "tls_mode" SET DEFAULT 'opportunistic';

-- AlterTable
ALTER TABLE "webhooks" ADD COLUMN     "reference" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "webhooks_reference_key" ON "webhooks"("reference");
