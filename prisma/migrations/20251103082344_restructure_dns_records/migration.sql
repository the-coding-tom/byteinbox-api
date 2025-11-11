/*
  Warnings:

  - You are about to drop the column `record_type` on the `dns_records` table. All the data in the column will be lost.
  - Added the required column `record` to the `dns_records` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "dns_records" DROP COLUMN "record_type",
ADD COLUMN     "record" TEXT NOT NULL,
ADD COLUMN     "ttl" TEXT NOT NULL DEFAULT 'Auto';
