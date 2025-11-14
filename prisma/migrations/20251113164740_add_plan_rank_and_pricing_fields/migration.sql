-- AlterTable
ALTER TABLE "plan_tiers" ADD COLUMN     "monthly_price_in_cents" INTEGER,
ADD COLUMN     "rank" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "yearly_price_in_cents" INTEGER;

-- AlterTable
ALTER TABLE "plans" ADD COLUMN     "is_free" BOOLEAN NOT NULL DEFAULT false;
