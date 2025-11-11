-- AlterTable
ALTER TABLE "emails" ADD COLUMN     "batch_reference" TEXT;

-- CreateIndex
CREATE INDEX "emails_batch_reference_idx" ON "emails"("batch_reference");
