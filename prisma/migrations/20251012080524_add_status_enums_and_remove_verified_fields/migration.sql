/*
  Warnings:

  - You are about to drop the column `is_verified` on the `mfa_verification_sessions` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "MfaVerificationSessionStatus" AS ENUM ('pending', 'verified', 'expired', 'failed');

-- AlterTable
ALTER TABLE "mfa_verification_sessions" DROP COLUMN "is_verified",
ADD COLUMN     "status" "MfaVerificationSessionStatus" NOT NULL DEFAULT 'pending';
