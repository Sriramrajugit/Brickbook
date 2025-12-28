-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'SITE_MANAGER', 'GUEST');

-- AlterTable
ALTER TABLE "accounts" ADD COLUMN     "siteId" INTEGER;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'GUEST',
ADD COLUMN     "siteId" INTEGER;

-- CreateTable
CREATE TABLE "sites" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sites_name_key" ON "sites"("name");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;
