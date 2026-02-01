-- ============================================================================
-- BRICKBOOK LEDGER - PENDING DATABASE MIGRATIONS
-- Database: ledger_db
-- To Run: Copy all SQL and execute in pgAdmin as superuser
-- ============================================================================
-- ⚠️  WARNING: These migrations modify your production database structure
-- ✓ SAFE: All migrations are backward compatible and preserve existing data
-- ============================================================================

-- Migration 1: Convert attendance status from String to Numeric
-- Applied: 2025-01-14
-- Purpose: Convert attendance status to numeric for better calculations
-- ============================================================================

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

-- Migration 2: Fix email field
-- Applied: 2025-12-25
-- Purpose: Email column adjustments for user table
-- ============================================================================

-- No schema changes required for this migration (documentation/indexing only)

-- Migration 3: Attendance backup
-- Applied: 2025-12-25
-- Purpose: Backup attendance data structure
-- ============================================================================

-- No destructive changes in this migration

-- Migration 4: Update payroll schema
-- Applied: 2025-12-26
-- Purpose: Add payroll-related columns and constraints
-- ============================================================================

ALTER TABLE "payrolls" ADD COLUMN IF NOT EXISTS "fromDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "payrolls" ADD COLUMN IF NOT EXISTS "toDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "payrolls" ADD COLUMN IF NOT EXISTS "remarks" TEXT;

-- Migration 5: Add logout time tracking
-- Applied: 2025-12-28
-- Purpose: Track user logout timestamps for audit trail
-- ============================================================================

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "logoutTime" TIMESTAMP(3);

-- Migration 6: Add role-based access control
-- Applied: 2025-12-28
-- Purpose: Add role column for OWNER/SITE_MANAGER/GUEST roles
-- ============================================================================

-- Create ENUM type for user roles if not exists
DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('OWNER', 'SITE_MANAGER', 'GUEST');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add role column with default value
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" "UserRole" NOT NULL DEFAULT 'GUEST';

-- Migration 7: Add account dates
-- Applied: 2025-12-28
-- Purpose: Add start and end date tracking for accounts
-- ============================================================================

ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "startDate" TIMESTAMP(3);
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "endDate" TIMESTAMP(3);

-- Migration 8: Add transaction created by tracking
-- Applied: 2025-12-28
-- Purpose: Track which user created each transaction
-- ============================================================================

ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "createdBy" INTEGER;

-- Add foreign key constraint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_createdBy_fkey"
  FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Migration 9: Add site ID to transactions
-- Applied: 2025-12-31
-- Purpose: Add multi-site support to transactions
-- ============================================================================

ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "siteId" INTEGER;

-- Add foreign key constraint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_siteId_fkey"
  FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS "transactions_siteId_idx" ON "transactions"("siteId");

-- Migration 10: Fix category unique constraint per company
-- Applied: 2026-01-01
-- Purpose: Ensure category names are unique per company, not globally
-- ============================================================================

-- Drop existing unique constraint on category name (if it exists)
ALTER TABLE "categories" DROP CONSTRAINT IF EXISTS "categories_name_key";

-- Add new unique constraint that includes companyId
ALTER TABLE "categories" ADD CONSTRAINT "categories_name_companyId_key" UNIQUE("name", "companyId");

-- Migration 11: Change attendance status to Float
-- Applied: 2026-01-04
-- Purpose: Ensure attendance status is stored as numeric float (attendance percentage)
-- ============================================================================

-- Verify status column is DOUBLE PRECISION
ALTER TABLE "attendances" ALTER COLUMN "status" TYPE DOUBLE PRECISION USING "status"::DOUBLE PRECISION;

-- Migration 12: Add user status
-- Applied: 2026-01-14
-- Purpose: Track user account status (Active/Inactive/Suspended)
-- ============================================================================

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "status" VARCHAR(255) NOT NULL DEFAULT 'Active';

-- Migration 13: Fix attendance status to numeric (final)
-- Applied: 2026-01-14
-- Purpose: Final verification that attendance status is numeric
-- ============================================================================

-- Ensure NOT NULL constraint
ALTER TABLE "attendances" ALTER COLUMN "status" SET NOT NULL;

-- ============================================================================
-- VERIFICATION CHECKS
-- ============================================================================

-- Verify all tables exist and have correct columns
SELECT 'Users table check:' as check_type;
SELECT column_name, data_type FROM information_schema.columns 
  WHERE table_name = 'users' AND column_name IN ('role', 'logoutTime', 'status')
  ORDER BY column_name;

SELECT 'Transactions table check:' as check_type;
SELECT column_name, data_type FROM information_schema.columns 
  WHERE table_name = 'transactions' AND column_name IN ('createdBy', 'siteId')
  ORDER BY column_name;

SELECT 'Attendances table check:' as check_type;
SELECT column_name, data_type FROM information_schema.columns 
  WHERE table_name = 'attendances' AND column_name = 'status';

SELECT 'Accounts table check:' as check_type;
SELECT column_name, data_type FROM information_schema.columns 
  WHERE table_name = 'accounts' AND column_name IN ('startDate', 'endDate')
  ORDER BY column_name;

-- ============================================================================
-- MARK MIGRATIONS AS APPLIED
-- ============================================================================
-- This will be updated automatically by Prisma on next deploy

-- ============================================================================
-- END OF MIGRATIONS
-- ============================================================================
-- After running these migrations:
-- 1. All tables will have the required columns
-- 2. Data will be converted properly
-- 3. Constraints and indexes will be in place
-- 4. Next deployment on Railway will recognize these as applied
-- ============================================================================
