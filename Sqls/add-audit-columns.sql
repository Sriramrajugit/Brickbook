-- Add loginTime and logoutTime columns to users table for audit tracking
-- Safe SQL script - adds columns only if they don't already exist
-- Multi-tenant ready - works for all customer data in single database
-- Execute this in PGAdmin: Tools > Query Tool > Paste this entire script > Run

ALTER TABLE "users" 
ADD COLUMN IF NOT EXISTS "loginTime" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "logoutTime" TIMESTAMP(3);

-- Verify columns were added
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_name = 'users' 
  AND (column_name = 'loginTime' OR column_name = 'logoutTime')
ORDER BY 
  ordinal_position;
