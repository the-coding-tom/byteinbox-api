/*
  Warnings:

  - You are about to drop the column `type` on the `attachments` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "attachments" DROP COLUMN "type",
ADD COLUMN     "content_type" TEXT;
