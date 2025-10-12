/*
  Warnings:

  - The `status` column on the `api_keys` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `broadcast_recipients` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `broadcasts` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `contacts` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `verified` on the `dns_records` table. All the data in the column will be lost.
  - The `status` column on the `dns_records` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `domains` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `emails` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `team_invitations` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `templates` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `webhooks` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `status` on the `logs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `webhook_deliveries` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "TeamInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DomainStatus" AS ENUM ('PENDING', 'VERIFIED', 'FAILED');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED');

-- CreateEnum
CREATE TYPE "TemplateStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "WebhookStatus" AS ENUM ('ENABLED', 'DISABLED');

-- CreateEnum
CREATE TYPE "WebhookDeliveryStatus" AS ENUM ('ATTEMPTING', 'SUCCESS', 'FAIL');

-- CreateEnum
CREATE TYPE "ApiKeyStatus" AS ENUM ('ACTIVE', 'REVOKED');

-- CreateEnum
CREATE TYPE "ContactStatus" AS ENUM ('SUBSCRIBED', 'UNSUBSCRIBED', 'BOUNCED');

-- CreateEnum
CREATE TYPE "BroadcastStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BroadcastRecipientStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'OPENED', 'CLICKED');

-- AlterTable
ALTER TABLE "api_keys" DROP COLUMN "status",
ADD COLUMN     "status" "ApiKeyStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "broadcast_recipients" DROP COLUMN "status",
ADD COLUMN     "status" "BroadcastRecipientStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "broadcasts" DROP COLUMN "status",
ADD COLUMN     "status" "BroadcastStatus" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "contacts" DROP COLUMN "status",
ADD COLUMN     "status" "ContactStatus" NOT NULL DEFAULT 'SUBSCRIBED';

-- AlterTable
ALTER TABLE "dns_records" DROP COLUMN "verified",
DROP COLUMN "status",
ADD COLUMN     "status" "DomainStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "domains" DROP COLUMN "status",
ADD COLUMN     "status" "DomainStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "emails" DROP COLUMN "status",
ADD COLUMN     "status" "EmailStatus" NOT NULL DEFAULT 'QUEUED';

-- AlterTable
ALTER TABLE "logs" DROP COLUMN "status",
ADD COLUMN     "status" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "team_invitations" DROP COLUMN "status",
ADD COLUMN     "status" "TeamInvitationStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "templates" DROP COLUMN "status",
ADD COLUMN     "status" "TemplateStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "webhook_deliveries" DROP COLUMN "status",
ADD COLUMN     "status" "WebhookDeliveryStatus" NOT NULL;

-- AlterTable
ALTER TABLE "webhooks" DROP COLUMN "status",
ADD COLUMN     "status" "WebhookStatus" NOT NULL DEFAULT 'ENABLED';
