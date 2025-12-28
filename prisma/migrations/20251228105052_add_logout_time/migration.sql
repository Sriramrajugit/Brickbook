/*
  Warnings:

  - You are about to drop the column `balance` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `attendances` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `attendances` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[employeeId,date]` on the table `attendances` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `employeeId` to the `advances` table without a default value. This is not possible if the table is not empty.
  - Made the column `accountId` on table `payrolls` required. This step will fail if there are existing NULL values in that column.
  - Made the column `fromDate` on table `payrolls` required. This step will fail if there are existing NULL values in that column.
  - Made the column `toDate` on table `payrolls` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "attendances" DROP CONSTRAINT "attendances_employeeId_fkey";

-- DropIndex
DROP INDEX "employees_email_key";

-- AlterTable
ALTER TABLE "accounts" DROP COLUMN "balance",
ADD COLUMN     "budget" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'General';

-- AlterTable
ALTER TABLE "advances" ADD COLUMN     "employeeId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "attendances" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "payrolls" ALTER COLUMN "accountId" SET NOT NULL,
ALTER COLUMN "fromDate" SET NOT NULL,
ALTER COLUMN "toDate" SET NOT NULL;

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "categoryId" INTEGER,
ADD COLUMN     "paymentMode" TEXT NOT NULL DEFAULT 'G-Pay';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "logoutTime" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "attendances_employeeId_date_key" ON "attendances"("employeeId", "date");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advances" ADD CONSTRAINT "advances_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
