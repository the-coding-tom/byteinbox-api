/*
  Warnings:

  - You are about to drop the `template_version_metrics` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."template_version_metrics" DROP CONSTRAINT "template_version_metrics_template_version_id_fkey";

-- AlterTable
ALTER TABLE "template_versions" ADD COLUMN     "bounced" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "clicks" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "delivered" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "opens" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sent" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "public"."template_version_metrics";
