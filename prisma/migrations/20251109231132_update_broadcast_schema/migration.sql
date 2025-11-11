/*
  Warnings:

  - You are about to drop the column `clicks` on the `broadcasts` table. All the data in the column will be lost.
  - You are about to drop the column `opens` on the `broadcasts` table. All the data in the column will be lost.
  - You are about to drop the column `total_sent` on the `broadcasts` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "EmailType" AS ENUM ('transactional', 'marketing');

-- AlterEnum
ALTER TYPE "EmailStatus" ADD VALUE 'draft';

-- AlterTable
ALTER TABLE "broadcasts" DROP COLUMN "clicks",
DROP COLUMN "opens",
DROP COLUMN "total_sent";

-- AlterTable
ALTER TABLE "emails" ADD COLUMN     "broadcast_id" INTEGER,
ADD COLUMN     "scheduled_at" TIMESTAMP(3),
ADD COLUMN     "sent_at" TIMESTAMP(3),
ADD COLUMN     "type" "EmailType" NOT NULL DEFAULT 'transactional';

-- CreateIndex
CREATE INDEX "emails_type_idx" ON "emails"("type");

-- CreateIndex
CREATE INDEX "emails_scheduled_at_idx" ON "emails"("scheduled_at");

-- CreateIndex
CREATE INDEX "emails_broadcast_id_idx" ON "emails"("broadcast_id");

-- AddForeignKey
ALTER TABLE "emails" ADD CONSTRAINT "emails_broadcast_id_fkey" FOREIGN KEY ("broadcast_id") REFERENCES "broadcasts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
