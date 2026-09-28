-- AddColumn package to Company table with default FOUNDATION
ALTER TABLE "companies" ADD COLUMN "package" TEXT NOT NULL DEFAULT 'FOUNDATION';

-- Add constraint to ensure only valid package values
ALTER TABLE "companies" ADD CONSTRAINT "companies_package_check" CHECK ("package" IN ('FOUNDATION', 'STRUCTURE', 'LANDMARK'));
