/*
  Warnings:

  - A unique constraint covering the columns `[name,companyId]` on the table `categories` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "categories_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_companyId_key" ON "categories"("name", "companyId");
