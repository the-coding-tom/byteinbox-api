/*
  Warnings:

  - The `status` column on the `template_versions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[template_id,version_number]` on the table `template_versions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `version_number` to the `template_versions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TemplateVersionStatus" AS ENUM ('draft', 'published', 'archived');

-- AlterEnum
ALTER TYPE "TemplateStatus" ADD VALUE 'deleted';

-- DropForeignKey
ALTER TABLE "public"."templates" DROP CONSTRAINT "templates_created_by_fkey";

-- AlterTable
ALTER TABLE "template_versions" ADD COLUMN     "created_by" INTEGER,
ADD COLUMN     "published_by" INTEGER,
ADD COLUMN     "rowVersion" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "version_number" INTEGER NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "TemplateVersionStatus" NOT NULL DEFAULT 'draft';

-- AlterTable
ALTER TABLE "templates" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "template_versions_status_idx" ON "template_versions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "template_versions_template_id_version_number_key" ON "template_versions"("template_id", "version_number");

-- CreateIndex
CREATE INDEX "templates_reference_idx" ON "templates"("reference");

-- AddForeignKey
ALTER TABLE "templates" ADD CONSTRAINT "templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_versions" ADD CONSTRAINT "template_versions_published_by_fkey" FOREIGN KEY ("published_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_versions" ADD CONSTRAINT "template_versions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
