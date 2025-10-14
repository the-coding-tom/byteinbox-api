/*
  Warnings:

  - The `role` column on the `team_members` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `logs` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "TeamMemberRole" AS ENUM ('owner', 'admin', 'member', 'viewer');

-- DropForeignKey
ALTER TABLE "public"."logs" DROP CONSTRAINT "logs_api_key_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."logs" DROP CONSTRAINT "logs_team_id_fkey";

-- AlterTable
ALTER TABLE "team_members" DROP COLUMN "role",
ADD COLUMN     "role" "TeamMemberRole" NOT NULL DEFAULT 'member';

-- DropTable
DROP TABLE "public"."logs";

-- CreateTable
CREATE TABLE "api_request_logs" (
    "id" TEXT NOT NULL,
    "team_id" INTEGER NOT NULL,
    "api_key_id" INTEGER,
    "endpoint" TEXT NOT NULL,
    "http_method" TEXT NOT NULL,
    "status_code" INTEGER NOT NULL,
    "response_time" INTEGER NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "request_body" JSONB,
    "response_body" JSONB,
    "error_message" TEXT,
    "error_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_request_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_usage_metrics" (
    "id" TEXT NOT NULL,
    "team_id" INTEGER NOT NULL,
    "api_key_id" INTEGER,
    "date" DATE NOT NULL,
    "hour" INTEGER,
    "total_requests" INTEGER NOT NULL DEFAULT 0,
    "successful_requests" INTEGER NOT NULL DEFAULT 0,
    "failed_requests" INTEGER NOT NULL DEFAULT 0,
    "status2xx" INTEGER NOT NULL DEFAULT 0,
    "status4xx" INTEGER NOT NULL DEFAULT 0,
    "status5xx" INTEGER NOT NULL DEFAULT 0,
    "avg_response_time" INTEGER NOT NULL DEFAULT 0,
    "endpoint_stats" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_usage_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "api_request_logs_team_id_created_at_idx" ON "api_request_logs"("team_id", "created_at");

-- CreateIndex
CREATE INDEX "api_request_logs_api_key_id_created_at_idx" ON "api_request_logs"("api_key_id", "created_at");

-- CreateIndex
CREATE INDEX "api_request_logs_created_at_idx" ON "api_request_logs"("created_at");

-- CreateIndex
CREATE INDEX "api_request_logs_status_code_idx" ON "api_request_logs"("status_code");

-- CreateIndex
CREATE INDEX "api_usage_metrics_team_id_date_idx" ON "api_usage_metrics"("team_id", "date");

-- CreateIndex
CREATE INDEX "api_usage_metrics_api_key_id_date_idx" ON "api_usage_metrics"("api_key_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "api_usage_metrics_team_id_api_key_id_date_hour_key" ON "api_usage_metrics"("team_id", "api_key_id", "date", "hour");

-- AddForeignKey
ALTER TABLE "api_request_logs" ADD CONSTRAINT "api_request_logs_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_request_logs" ADD CONSTRAINT "api_request_logs_api_key_id_fkey" FOREIGN KEY ("api_key_id") REFERENCES "api_keys"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_usage_metrics" ADD CONSTRAINT "api_usage_metrics_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_usage_metrics" ADD CONSTRAINT "api_usage_metrics_api_key_id_fkey" FOREIGN KEY ("api_key_id") REFERENCES "api_keys"("id") ON DELETE SET NULL ON UPDATE CASCADE;
