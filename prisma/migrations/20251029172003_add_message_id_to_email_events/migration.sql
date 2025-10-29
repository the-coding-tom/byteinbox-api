-- AlterTable
ALTER TABLE "email_events" ADD COLUMN     "message_id" TEXT;

-- CreateIndex
CREATE INDEX "email_events_message_id_idx" ON "email_events"("message_id");
