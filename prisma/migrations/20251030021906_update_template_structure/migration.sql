/*
  Warnings:

  - The `variables` column on the `templates` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[reference]` on the table `templates` will be added. If there are existing duplicate values, this will fail.
  - The required column `reference` was added to the `templates` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "templates" ADD COLUMN     "from" TEXT,
ADD COLUMN     "reference" TEXT NOT NULL,
ADD COLUMN     "reply_to" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "text" TEXT,
DROP COLUMN "variables",
ADD COLUMN     "variables" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "templates_reference_key" ON "templates"("reference");
