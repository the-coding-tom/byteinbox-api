/*
  Warnings:

  - The values [ACTIVE,REVOKED] on the enum `ApiKeyStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [PENDING,SENT,FAILED,OPENED,CLICKED] on the enum `BroadcastRecipientStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [DRAFT,SCHEDULED,SENDING,SENT,CANCELLED] on the enum `BroadcastStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [SUBSCRIBED,UNSUBSCRIBED,BOUNCED] on the enum `ContactStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [PENDING,VERIFIED,FAILED] on the enum `DomainStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [QUEUED,SENT,DELIVERED,FAILED,BOUNCED] on the enum `EmailStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [PENDING,ACCEPTED,EXPIRED,CANCELLED] on the enum `TeamInvitationStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [ACTIVE,ARCHIVED] on the enum `TemplateStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [ATTEMPTING,SUCCESS,FAIL] on the enum `WebhookDeliveryStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [ENABLED,DISABLED] on the enum `WebhookStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ApiKeyStatus_new" AS ENUM ('active', 'revoked');
ALTER TABLE "public"."api_keys" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "api_keys" ALTER COLUMN "status" TYPE "ApiKeyStatus_new" USING ("status"::text::"ApiKeyStatus_new");
ALTER TYPE "ApiKeyStatus" RENAME TO "ApiKeyStatus_old";
ALTER TYPE "ApiKeyStatus_new" RENAME TO "ApiKeyStatus";
DROP TYPE "public"."ApiKeyStatus_old";
ALTER TABLE "api_keys" ALTER COLUMN "status" SET DEFAULT 'active';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "BroadcastRecipientStatus_new" AS ENUM ('pending', 'sent', 'failed', 'opened', 'clicked');
ALTER TABLE "public"."broadcast_recipients" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "broadcast_recipients" ALTER COLUMN "status" TYPE "BroadcastRecipientStatus_new" USING ("status"::text::"BroadcastRecipientStatus_new");
ALTER TYPE "BroadcastRecipientStatus" RENAME TO "BroadcastRecipientStatus_old";
ALTER TYPE "BroadcastRecipientStatus_new" RENAME TO "BroadcastRecipientStatus";
DROP TYPE "public"."BroadcastRecipientStatus_old";
ALTER TABLE "broadcast_recipients" ALTER COLUMN "status" SET DEFAULT 'pending';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "BroadcastStatus_new" AS ENUM ('draft', 'scheduled', 'sending', 'sent', 'cancelled');
ALTER TABLE "public"."broadcasts" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "broadcasts" ALTER COLUMN "status" TYPE "BroadcastStatus_new" USING ("status"::text::"BroadcastStatus_new");
ALTER TYPE "BroadcastStatus" RENAME TO "BroadcastStatus_old";
ALTER TYPE "BroadcastStatus_new" RENAME TO "BroadcastStatus";
DROP TYPE "public"."BroadcastStatus_old";
ALTER TABLE "broadcasts" ALTER COLUMN "status" SET DEFAULT 'draft';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ContactStatus_new" AS ENUM ('subscribed', 'unsubscribed', 'bounced');
ALTER TABLE "public"."contacts" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "contacts" ALTER COLUMN "status" TYPE "ContactStatus_new" USING ("status"::text::"ContactStatus_new");
ALTER TYPE "ContactStatus" RENAME TO "ContactStatus_old";
ALTER TYPE "ContactStatus_new" RENAME TO "ContactStatus";
DROP TYPE "public"."ContactStatus_old";
ALTER TABLE "contacts" ALTER COLUMN "status" SET DEFAULT 'subscribed';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "DomainStatus_new" AS ENUM ('pending', 'verified', 'failed');
ALTER TABLE "public"."dns_records" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."domains" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "domains" ALTER COLUMN "status" TYPE "DomainStatus_new" USING ("status"::text::"DomainStatus_new");
ALTER TABLE "dns_records" ALTER COLUMN "status" TYPE "DomainStatus_new" USING ("status"::text::"DomainStatus_new");
ALTER TYPE "DomainStatus" RENAME TO "DomainStatus_old";
ALTER TYPE "DomainStatus_new" RENAME TO "DomainStatus";
DROP TYPE "public"."DomainStatus_old";
ALTER TABLE "dns_records" ALTER COLUMN "status" SET DEFAULT 'pending';
ALTER TABLE "domains" ALTER COLUMN "status" SET DEFAULT 'pending';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "EmailStatus_new" AS ENUM ('queued', 'sent', 'delivered', 'failed', 'bounced');
ALTER TABLE "public"."emails" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "emails" ALTER COLUMN "status" TYPE "EmailStatus_new" USING ("status"::text::"EmailStatus_new");
ALTER TYPE "EmailStatus" RENAME TO "EmailStatus_old";
ALTER TYPE "EmailStatus_new" RENAME TO "EmailStatus";
DROP TYPE "public"."EmailStatus_old";
ALTER TABLE "emails" ALTER COLUMN "status" SET DEFAULT 'queued';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TeamInvitationStatus_new" AS ENUM ('pending', 'accepted', 'expired', 'cancelled');
ALTER TABLE "public"."team_invitations" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "team_invitations" ALTER COLUMN "status" TYPE "TeamInvitationStatus_new" USING ("status"::text::"TeamInvitationStatus_new");
ALTER TYPE "TeamInvitationStatus" RENAME TO "TeamInvitationStatus_old";
ALTER TYPE "TeamInvitationStatus_new" RENAME TO "TeamInvitationStatus";
DROP TYPE "public"."TeamInvitationStatus_old";
ALTER TABLE "team_invitations" ALTER COLUMN "status" SET DEFAULT 'pending';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TemplateStatus_new" AS ENUM ('active', 'archived');
ALTER TABLE "public"."templates" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "templates" ALTER COLUMN "status" TYPE "TemplateStatus_new" USING ("status"::text::"TemplateStatus_new");
ALTER TYPE "TemplateStatus" RENAME TO "TemplateStatus_old";
ALTER TYPE "TemplateStatus_new" RENAME TO "TemplateStatus";
DROP TYPE "public"."TemplateStatus_old";
ALTER TABLE "templates" ALTER COLUMN "status" SET DEFAULT 'active';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "WebhookDeliveryStatus_new" AS ENUM ('attempting', 'success', 'fail');
ALTER TABLE "webhook_deliveries" ALTER COLUMN "status" TYPE "WebhookDeliveryStatus_new" USING ("status"::text::"WebhookDeliveryStatus_new");
ALTER TYPE "WebhookDeliveryStatus" RENAME TO "WebhookDeliveryStatus_old";
ALTER TYPE "WebhookDeliveryStatus_new" RENAME TO "WebhookDeliveryStatus";
DROP TYPE "public"."WebhookDeliveryStatus_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "WebhookStatus_new" AS ENUM ('enabled', 'disabled');
ALTER TABLE "public"."webhooks" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "webhooks" ALTER COLUMN "status" TYPE "WebhookStatus_new" USING ("status"::text::"WebhookStatus_new");
ALTER TYPE "WebhookStatus" RENAME TO "WebhookStatus_old";
ALTER TYPE "WebhookStatus_new" RENAME TO "WebhookStatus";
DROP TYPE "public"."WebhookStatus_old";
ALTER TABLE "webhooks" ALTER COLUMN "status" SET DEFAULT 'enabled';
COMMIT;

-- AlterTable
ALTER TABLE "api_keys" ALTER COLUMN "status" SET DEFAULT 'active';

-- AlterTable
ALTER TABLE "broadcast_recipients" ALTER COLUMN "status" SET DEFAULT 'pending';

-- AlterTable
ALTER TABLE "broadcasts" ALTER COLUMN "status" SET DEFAULT 'draft';

-- AlterTable
ALTER TABLE "contacts" ALTER COLUMN "status" SET DEFAULT 'subscribed';

-- AlterTable
ALTER TABLE "dns_records" ALTER COLUMN "status" SET DEFAULT 'pending';

-- AlterTable
ALTER TABLE "domains" ALTER COLUMN "status" SET DEFAULT 'pending';

-- AlterTable
ALTER TABLE "emails" ALTER COLUMN "status" SET DEFAULT 'queued';

-- AlterTable
ALTER TABLE "team_invitations" ALTER COLUMN "status" SET DEFAULT 'pending';

-- AlterTable
ALTER TABLE "templates" ALTER COLUMN "status" SET DEFAULT 'active';

-- AlterTable
ALTER TABLE "webhooks" ALTER COLUMN "status" SET DEFAULT 'enabled';
