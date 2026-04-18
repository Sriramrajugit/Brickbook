-- Fix Attendance Status Column: Convert from String to Numeric
-- Run this script directly in your PostgreSQL database
-- This will convert all existing string status values to numeric values:
-- "Present" = 1, "Absent" = 0, "OT4Hrs"/"OT4hrs" = 1.5, "OT8Hrs"/"OT8hrs" = 2

-- Step 1: Create a new column with numeric type
ALTER TABLE "attendances" ADD COLUMN "status_numeric" DOUBLE PRECISION;

-- Step 2: Convert existing string values to numeric
UPDATE "attendances" SET "status_numeric" = CASE
  WHEN "status" = 'Present' THEN 1.0
  WHEN "status" = 'Absent' THEN 0.0
  WHEN "status" = 'OT4Hrs' OR "status" = 'OT4hrs' THEN 1.5
  WHEN "status" = 'OT8Hrs' OR "status" = 'OT8hrs' THEN 2.0
  ELSE 1.0
END;

-- Step 3: Drop the old string column
ALTER TABLE "attendances" DROP COLUMN "status" CASCADE;

-- Step 4: Rename the new numeric column to original name
ALTER TABLE "attendances" RENAME COLUMN "status_numeric" TO "status";

-- Step 5: Set NOT NULL constraint
ALTER TABLE "attendances" ALTER COLUMN "status" SET NOT NULL;

-- Done! The attendance.status column is now numeric (DOUBLE PRECISION)
-- Prisma will now accept numeric values like 1, 1.5, 2, 0
