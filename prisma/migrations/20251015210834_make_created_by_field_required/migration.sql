/*
  Warnings:

  - Made the column `created_by` on table `api_keys` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "api_keys" ALTER COLUMN "created_by" SET NOT NULL;
