-- AlterTable: Update Payroll table structure
-- Add new columns and drop old ones
ALTER TABLE "payrolls" ADD COLUMN "accountId" INTEGER;
ALTER TABLE "payrolls" ADD COLUMN "fromDate" TIMESTAMP(3);
ALTER TABLE "payrolls" ADD COLUMN "toDate" TIMESTAMP(3);
ALTER TABLE "payrolls" ADD COLUMN "remarks" TEXT;

-- Drop old columns
ALTER TABLE "payrolls" DROP COLUMN IF EXISTS "month";
ALTER TABLE "payrolls" DROP COLUMN IF EXISTS "year";