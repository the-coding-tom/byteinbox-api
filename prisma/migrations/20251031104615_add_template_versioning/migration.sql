/*
  Warnings:

  - You are about to drop the column `category` on the `templates` table. All the data in the column will be lost.
  - You are about to drop the column `clicks` on the `templates` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `templates` table. All the data in the column will be lost.
  - You are about to drop the column `from` on the `templates` table. All the data in the column will be lost.
  - You are about to drop the column `html` on the `templates` table. All the data in the column will be lost.
  - You are about to drop the column `last_modified` on the `templates` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `templates` table. All the data in the column will be lost.
  - You are about to drop the column `opens` on the `templates` table. All the data in the column will be lost.
  - You are about to drop the column `reply_to` on the `templates` table. All the data in the column will be lost.
  - You are about to drop the column `subject` on the `templates` table. All the data in the column will be lost.
  - You are about to drop the column `text` on the `templates` table. All the data in the column will be lost.
  - You are about to drop the column `variables` on the `templates` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[current_version_id]` on the table `templates` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `alias` to the `templates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `templates` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "templates" DROP COLUMN "category",
DROP COLUMN "clicks",
DROP COLUMN "description",
DROP COLUMN "from",
DROP COLUMN "html",
DROP COLUMN "last_modified",
DROP COLUMN "name",
DROP COLUMN "opens",
DROP COLUMN "reply_to",
DROP COLUMN "subject",
DROP COLUMN "text",
DROP COLUMN "variables",
ADD COLUMN     "alias" TEXT NOT NULL,
ADD COLUMN     "current_version_id" INTEGER,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "template_versions" (
    "id" SERIAL NOT NULL,
    "reference" TEXT NOT NULL,
    "template_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "html" TEXT NOT NULL,
    "text" TEXT,
    "subject" TEXT,
    "category" TEXT,
    "from" TEXT,
    "reply_to" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'draft',
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "template_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_variables" (
    "id" SERIAL NOT NULL,
    "template_version_id" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fallback_value" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "template_variables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_version_metrics" (
    "id" SERIAL NOT NULL,
    "template_version_id" INTEGER NOT NULL,
    "opens" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "sent" INTEGER NOT NULL DEFAULT 0,
    "delivered" INTEGER NOT NULL DEFAULT 0,
    "bounced" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "template_version_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "template_versions_reference_key" ON "template_versions"("reference");

-- CreateIndex
CREATE INDEX "template_versions_template_id_idx" ON "template_versions"("template_id");

-- CreateIndex
CREATE INDEX "template_versions_status_idx" ON "template_versions"("status");

-- CreateIndex
CREATE INDEX "template_variables_template_version_id_idx" ON "template_variables"("template_version_id");

-- CreateIndex
CREATE UNIQUE INDEX "template_version_metrics_template_version_id_key" ON "template_version_metrics"("template_version_id");

-- CreateIndex
CREATE UNIQUE INDEX "templates_current_version_id_key" ON "templates"("current_version_id");

-- CreateIndex
CREATE INDEX "templates_team_id_idx" ON "templates"("team_id");

-- CreateIndex
CREATE INDEX "templates_alias_team_id_idx" ON "templates"("alias", "team_id");

-- AddForeignKey
ALTER TABLE "templates" ADD CONSTRAINT "templates_current_version_id_fkey" FOREIGN KEY ("current_version_id") REFERENCES "template_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_versions" ADD CONSTRAINT "template_versions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_variables" ADD CONSTRAINT "template_variables_template_version_id_fkey" FOREIGN KEY ("template_version_id") REFERENCES "template_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_version_metrics" ADD CONSTRAINT "template_version_metrics_template_version_id_fkey" FOREIGN KEY ("template_version_id") REFERENCES "template_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
