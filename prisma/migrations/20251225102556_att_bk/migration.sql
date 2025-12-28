/*
  Warnings:

  - You are about to drop the column `createdAt` on the `attendances` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `attendances` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[employeeId,date]` on the table `attendances` will be added. If there are existing duplicate values, this will fail.


-- DropForeignKey
ALTER TABLE "attendances" DROP CONSTRAINT "attendances_employeeId_fkey";

-- AlterTable
ALTER TABLE "attendances" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

-- CreateIndex
CREATE UNIQUE INDEX "attendances_employeeId_date_key" ON "attendances"("employeeId", "date");

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
*/