/*
  Warnings:

  - You are about to drop the column `message_id` on the `emails` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."email_recipients_message_id_recipient_idx";

-- DropIndex
DROP INDEX "public"."emails_message_id_idx";

-- AlterTable
ALTER TABLE "email_recipients" ADD COLUMN     "sent_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "emails" DROP COLUMN "message_id";

-- CreateIndex
CREATE INDEX "email_recipients_message_id_idx" ON "email_recipients"("message_id");
