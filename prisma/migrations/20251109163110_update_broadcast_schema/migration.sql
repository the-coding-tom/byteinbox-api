/*
  Warnings:

  - You are about to drop the column `content` on the `broadcasts` table. All the data in the column will be lost.
  - You are about to drop the column `template_id` on the `broadcasts` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[reference]` on the table `broadcasts` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `from` to the `broadcasts` table without a default value. This is not possible if the table is not empty.
  - The required column `reference` was added to the `broadcasts` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Made the column `audience_id` on table `broadcasts` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."broadcasts" DROP CONSTRAINT "broadcasts_audience_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."broadcasts" DROP CONSTRAINT "broadcasts_template_id_fkey";

-- AlterTable
ALTER TABLE "broadcasts" DROP COLUMN "content",
DROP COLUMN "template_id",
ADD COLUMN     "from" TEXT NOT NULL,
ADD COLUMN     "html" TEXT,
ADD COLUMN     "reference" TEXT NOT NULL,
ADD COLUMN     "reply_to" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "text" TEXT,
ALTER COLUMN "audience_id" SET NOT NULL,
ALTER COLUMN "name" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "broadcasts_reference_key" ON "broadcasts"("reference");

-- CreateIndex
CREATE INDEX "broadcasts_reference_idx" ON "broadcasts"("reference");

-- CreateIndex
CREATE INDEX "broadcasts_team_id_idx" ON "broadcasts"("team_id");

-- CreateIndex
CREATE INDEX "broadcasts_audience_id_idx" ON "broadcasts"("audience_id");

-- AddForeignKey
ALTER TABLE "broadcasts" ADD CONSTRAINT "broadcasts_audience_id_fkey" FOREIGN KEY ("audience_id") REFERENCES "audiences"("id") ON DELETE CASCADE ON UPDATE CASCADE;
