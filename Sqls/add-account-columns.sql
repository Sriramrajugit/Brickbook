-- Add missing columns to accounts table
-- Safe SQL script - adds columns only if they don't already exist
-- Multi-tenant ready - works for all customers in single database
-- Execute this in PGAdmin: Tools > Query Tool > Paste > Run

ALTER TABLE "accounts" 
ADD COLUMN IF NOT EXISTS "address" TEXT,
ADD COLUMN IF NOT EXISTS "city" TEXT,
ADD COLUMN IF NOT EXISTS "state" TEXT,
ADD COLUMN IF NOT EXISTS "zip" TEXT;

-- Verify columns were added
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_name = 'accounts' 
  AND column_name IN ('address', 'city', 'state', 'zip')
ORDER BY 
  ordinal_position;
