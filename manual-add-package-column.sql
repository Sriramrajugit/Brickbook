-- Production Database Migration (Manual)
-- Add package column to companies table

-- Step 1: Add the package column with default value
ALTER TABLE "companies" ADD COLUMN "package" TEXT NOT NULL DEFAULT 'FOUNDATION';

-- Step 2: Add check constraint to ensure valid values
ALTER TABLE "companies" ADD CONSTRAINT "companies_package_check" 
  CHECK ("package" IN ('FOUNDATION', 'STRUCTURE', 'LANDMARK'));

-- Step 3: Verify the column was added
SELECT id, name, package FROM companies;

-- Done! All customers now have package = 'FOUNDATION' by default
-- Next: Update specific customers to STRUCTURE or LANDMARK as needed
