/*
  Warnings:

  - You are about to drop the column `description` on the `template_versions` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `template_versions` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name,team_id]` on the table `templates` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `templates` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "template_versions" DROP COLUMN "description",
DROP COLUMN "name";

-- AlterTable
ALTER TABLE "templates" ADD COLUMN     "description" TEXT,
ADD COLUMN     "name" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "templates_name_team_id_key" ON "templates"("name", "team_id");
