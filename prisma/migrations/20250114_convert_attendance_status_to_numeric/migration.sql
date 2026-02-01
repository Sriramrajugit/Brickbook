-- ConvertPropertyName attendances.status from String to Numeric

-- Step 1: Create a new column with numeric type
ALTER TABLE "attendances" ADD COLUMN "status_numeric" DOUBLE PRECISION;

-- Step 2: Convert existing string values to numeric
-- Map: "Present" = 1, "OT4Hrs" or "OT4hrs" = 1.5, "OT8Hrs" or "OT8hrs" = 2, "Absent" = 0
UPDATE "attendances" SET "status_numeric" = CASE
  WHEN "status" = 'Present' THEN 1
  WHEN "status" = 'Absent' THEN 0
  WHEN "status" = 'OT4Hrs' OR "status" = 'OT4hrs' THEN 1.5
  WHEN "status" = 'OT8Hrs' OR "status" = 'OT8hrs' THEN 2
  WHEN "status" ~ '^[0-9.]+$' THEN CAST("status" AS DOUBLE PRECISION)
  ELSE 1
END;

-- Step 3: Drop the old column
ALTER TABLE "attendances" DROP COLUMN "status";

-- Step 4: Rename the new column to original name
ALTER TABLE "attendances" RENAME COLUMN "status_numeric" TO "status";

-- Step 5: Set NOT NULL constraint
ALTER TABLE "attendances" ALTER COLUMN "status" SET NOT NULL;
