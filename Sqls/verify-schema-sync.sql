-- Schema Verification Script
-- Checks if all Prisma schema tables and columns exist in the database
-- Run this in PGAdmin to verify everything is in sync

-- Check User table columns
SELECT 'users' as table_name, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Check Account table columns  
SELECT 'accounts' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'accounts'
ORDER BY ordinal_position;

-- Check if all required tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check for missing columns
-- Users table should have: loginTime, logoutTime
SELECT CASE 
  WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'loginTime') THEN '✓ loginTime exists'
  ELSE '✗ MISSING: loginTime'
END as users_check_1,
CASE 
  WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'logoutTime') THEN '✓ logoutTime exists'
  ELSE '✗ MISSING: logoutTime'
END as users_check_2;

-- Accounts table should have: address, city, state, zip
SELECT CASE 
  WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'address') THEN '✓ address exists'
  ELSE '✗ MISSING: address'
END as accounts_check_1,
CASE 
  WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'city') THEN '✓ city exists'
  ELSE '✗ MISSING: city'
END as accounts_check_2,
CASE 
  WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'state') THEN '✓ state exists'
  ELSE '✗ MISSING: state'
END as accounts_check_3,
CASE 
  WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'zip') THEN '✓ zip exists'
  ELSE '✗ MISSING: zip'
END as accounts_check_4;
