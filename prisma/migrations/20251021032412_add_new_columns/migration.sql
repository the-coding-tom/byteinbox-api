/*
  Warnings:

  - You are about to drop the column `size` on the `attachments` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "attachments" DROP COLUMN "size",
ADD COLUMN     "path" TEXT,
ALTER COLUMN "content" DROP NOT NULL;
