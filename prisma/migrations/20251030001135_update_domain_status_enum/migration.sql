/*
  Warnings:

  - The values [pending_dns,dns_verified,pending_aws] on the enum `DomainStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DomainStatus_new" AS ENUM ('not_started', 'verifying_dns', 'verifying_aws_setup', 'verified', 'failed', 'revoked');
ALTER TABLE "public"."dns_records" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."domains" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "domains" ALTER COLUMN "status" TYPE "DomainStatus_new" USING ("status"::text::"DomainStatus_new");
ALTER TABLE "dns_records" ALTER COLUMN "status" TYPE "DomainStatus_new" USING ("status"::text::"DomainStatus_new");
ALTER TYPE "DomainStatus" RENAME TO "DomainStatus_old";
ALTER TYPE "DomainStatus_new" RENAME TO "DomainStatus";
DROP TYPE "public"."DomainStatus_old";
ALTER TABLE "dns_records" ALTER COLUMN "status" SET DEFAULT 'not_started';
ALTER TABLE "domains" ALTER COLUMN "status" SET DEFAULT 'not_started';
COMMIT;

-- AlterTable
ALTER TABLE "dns_records" ALTER COLUMN "status" SET DEFAULT 'not_started';

-- AlterTable
ALTER TABLE "domains" ALTER COLUMN "status" SET DEFAULT 'not_started';
