/*
  Warnings:

  - A unique constraint covering the columns `[reference]` on the table `audiences` will be added. If there are existing duplicate values, this will fail.
  - The required column `reference` was added to the `audiences` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `user_id` to the `verification_requests` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "audiences" ADD COLUMN     "reference" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "email_events" ADD COLUMN     "bounce_sub_type" TEXT,
ADD COLUMN     "bounce_type" TEXT,
ADD COLUMN     "complaint_feedback_type" TEXT;

-- AlterTable
ALTER TABLE "emails" ADD COLUMN     "message_id" TEXT;

-- AlterTable
ALTER TABLE "verification_requests" ADD COLUMN     "user_id" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "email_metrics" (
    "id" TEXT NOT NULL,
    "team_id" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "sent_count" INTEGER NOT NULL DEFAULT 0,
    "delivered_count" INTEGER NOT NULL DEFAULT 0,
    "bounced_count" INTEGER NOT NULL DEFAULT 0,
    "complained_count" INTEGER NOT NULL DEFAULT 0,
    "transient_bounces" INTEGER NOT NULL DEFAULT 0,
    "permanent_bounces" INTEGER NOT NULL DEFAULT 0,
    "undetermined_bounces" INTEGER NOT NULL DEFAULT 0,
    "deliverability_rate" INTEGER NOT NULL DEFAULT 0,
    "bounce_rate" INTEGER NOT NULL DEFAULT 0,
    "complain_rate" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_metrics_team_id_date_idx" ON "email_metrics"("team_id", "date");

-- CreateIndex
CREATE INDEX "email_metrics_date_idx" ON "email_metrics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "email_metrics_team_id_date_key" ON "email_metrics"("team_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "audiences_reference_key" ON "audiences"("reference");

-- CreateIndex
CREATE INDEX "email_events_type_timestamp_idx" ON "email_events"("type", "timestamp");

-- CreateIndex
CREATE INDEX "emails_message_id_idx" ON "emails"("message_id");

-- AddForeignKey
ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_metrics" ADD CONSTRAINT "email_metrics_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
