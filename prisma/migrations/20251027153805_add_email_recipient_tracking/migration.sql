/*
  Warnings:

  - You are about to drop the column `email_id` on the `email_events` table. All the data in the column will be lost.
  - You are about to drop the column `clicks` on the `emails` table. All the data in the column will be lost.
  - You are about to drop the column `delivered_at` on the `emails` table. All the data in the column will be lost.
  - You are about to drop the column `last_clicked` on the `emails` table. All the data in the column will be lost.
  - You are about to drop the column `last_opened` on the `emails` table. All the data in the column will be lost.
  - You are about to drop the column `opened_at` on the `emails` table. All the data in the column will be lost.
  - You are about to drop the column `opens` on the `emails` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `emails` table. All the data in the column will be lost.
  - Added the required column `email_recipient_id` to the `email_events` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."email_events" DROP CONSTRAINT "email_events_email_id_fkey";

-- AlterTable
ALTER TABLE "email_events" DROP COLUMN "email_id",
ADD COLUMN     "email_recipient_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "emails" DROP COLUMN "clicks",
DROP COLUMN "delivered_at",
DROP COLUMN "last_clicked",
DROP COLUMN "last_opened",
DROP COLUMN "opened_at",
DROP COLUMN "opens",
DROP COLUMN "status",
ALTER COLUMN "to" SET DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "email_recipients" (
    "id" SERIAL NOT NULL,
    "email_id" INTEGER NOT NULL,
    "recipient" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'to',
    "status" "EmailStatus" NOT NULL DEFAULT 'queued',
    "message_id" TEXT,
    "opens" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "last_opened" TIMESTAMP(3),
    "last_clicked" TIMESTAMP(3),
    "opened_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_recipients_message_id_recipient_idx" ON "email_recipients"("message_id", "recipient");

-- CreateIndex
CREATE INDEX "email_recipients_email_id_idx" ON "email_recipients"("email_id");

-- CreateIndex
CREATE INDEX "email_events_email_recipient_id_idx" ON "email_events"("email_recipient_id");

-- AddForeignKey
ALTER TABLE "email_recipients" ADD CONSTRAINT "email_recipients_email_id_fkey" FOREIGN KEY ("email_id") REFERENCES "emails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_events" ADD CONSTRAINT "email_events_email_recipient_id_fkey" FOREIGN KEY ("email_recipient_id") REFERENCES "email_recipients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
