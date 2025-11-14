/*
  Warnings:

  - You are about to drop the column `billing_interval` on the `plans` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `plans` table. All the data in the column will be lost.
  - You are about to drop the column `max_emails_per_month` on the `plans` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `plans` table. All the data in the column will be lost.
  - You are about to drop the column `yearly_price` on the `plans` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[reference]` on the table `attachments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug,plan_type]` on the table `plans` will be added. If there are existing duplicate values, this will fail.
  - The required column `reference` was added to the `attachments` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `max_emails_per_day` to the `plans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `plan_type` to the `plans` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('TRANSACTIONAL', 'MARKETING');

-- AlterEnum
ALTER TYPE "EmailStatus" ADD VALUE 'scheduled';

-- DropIndex
DROP INDEX "public"."plans_name_key";

-- DropIndex
DROP INDEX "public"."plans_slug_key";

-- AlterTable
ALTER TABLE "attachments" ADD COLUMN     "content_id" TEXT,
ADD COLUMN     "download_url" TEXT,
ADD COLUMN     "expires_at" TIMESTAMP(3),
ADD COLUMN     "reference" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "plans" DROP COLUMN "billing_interval",
DROP COLUMN "currency",
DROP COLUMN "max_emails_per_month",
DROP COLUMN "price",
DROP COLUMN "yearly_price",
ADD COLUMN     "display_order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "is_contact_sales" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "max_emails_per_day" INTEGER NOT NULL,
ADD COLUMN     "plan_type" "PlanType" NOT NULL;

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "billing_interval" "BillingInterval" NOT NULL DEFAULT 'MONTHLY',
ADD COLUMN     "emails_sent_today" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "last_daily_reset" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "plan_tier_id" INTEGER;

-- CreateTable
CREATE TABLE "plan_tiers" (
    "id" SERIAL NOT NULL,
    "plan_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "min_emails" INTEGER NOT NULL,
    "max_emails" INTEGER NOT NULL,
    "monthly_price" DECIMAL(10,2) NOT NULL,
    "yearly_price" DECIMAL(10,2) NOT NULL,
    "stripe_monthly_price_id" TEXT,
    "stripe_yearly_price_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "plan_tiers_plan_id_idx" ON "plan_tiers"("plan_id");

-- CreateIndex
CREATE INDEX "plan_tiers_min_emails_max_emails_idx" ON "plan_tiers"("min_emails", "max_emails");

-- CreateIndex
CREATE UNIQUE INDEX "plan_tiers_plan_id_min_emails_key" ON "plan_tiers"("plan_id", "min_emails");

-- CreateIndex
CREATE UNIQUE INDEX "attachments_reference_key" ON "attachments"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "plans_slug_plan_type_key" ON "plans"("slug", "plan_type");

-- AddForeignKey
ALTER TABLE "plan_tiers" ADD CONSTRAINT "plan_tiers_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_tier_id_fkey" FOREIGN KEY ("plan_tier_id") REFERENCES "plan_tiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
