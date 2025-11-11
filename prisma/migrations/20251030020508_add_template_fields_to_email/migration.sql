-- AlterTable
ALTER TABLE "emails" ADD COLUMN     "template_data" JSONB,
ADD COLUMN     "template_id" INTEGER;

-- AddForeignKey
ALTER TABLE "emails" ADD CONSTRAINT "emails_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
