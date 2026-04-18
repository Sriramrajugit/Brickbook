-- =============================================================================
-- LEDGER SYSTEM - COMPLETE SQL ONBOARDING EXAMPLE
-- Ready to copy/paste - Just update company details!
-- =============================================================================

-- EXAMPLE DATA (Replace with your actual company details):
--   Company Name: ABC Corporation
--   Owner Email: owner@abccorp.com
--   Owner Name: ABC Owner
--   Password: owner123
--   Password Hash: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36CHqDLG

BEGIN;

-- ============================================================================
-- STEP 1: CREATE COMPANY
-- ============================================================================
-- NOTE: Removed ID specification - PostgreSQL will auto-increment
INSERT INTO companies (name, "createdAt", "updatedAt") 
VALUES (
  'ABC Corporation',
  NOW(),
  NOW()
)
RETURNING id, name;


-- ============================================================================
-- STEP 2: CREATE MAIN SITE
-- ============================================================================
INSERT INTO sites (name, location, "companyId", "createdAt", "updatedAt")
VALUES (
  'Main Office',
  'Headquarters',
  (SELECT id FROM companies WHERE name = 'ABC Corporation'),
  NOW(),
  NOW()
)
RETURNING id, name, "companyId";


-- ============================================================================
-- STEP 3: CREATE OWNER USER
-- ============================================================================
INSERT INTO users (
  email,
  name,
  password,
  role,
  "companyId",
  "siteId",
  status,
  "createdAt",
  "updatedAt"
)
VALUES (
  'owner@abccorp.com',
  'ABC Owner',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36CHqDLG',
  'OWNER',
  (SELECT id FROM companies WHERE name = 'ABC Corporation'),
  NULL,
  'Active',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET "updatedAt" = NOW()
RETURNING id, email, name, role;


-- ============================================================================
-- STEP 4: CREATE MAIN ACCOUNT
-- ============================================================================
INSERT INTO accounts (
  name,
  type,
  budget,
  "startDate",
  "endDate",
  "companyId",
  "siteId",
  "createdAt",
  "updatedAt"
)
VALUES (
  'Main Account',
  'General',
  100000.00,
  NOW(),
  NULL,
  (SELECT id FROM companies WHERE name = 'ABC Corporation'),
  (SELECT id FROM sites WHERE name = 'Main Office' AND "companyId" = (SELECT id FROM companies WHERE name = 'ABC Corporation')),
  NOW(),
  NOW()
)
RETURNING id, name, type, budget;


-- ============================================================================
-- STEP 5: CREATE DEFAULT CATEGORIES
-- ============================================================================
INSERT INTO categories (name, description, "companyId", "createdAt", "updatedAt")
VALUES
  ('Capital', 'Initial capital and investments', (SELECT id FROM companies WHERE name = 'ABC Corporation'), NOW(), NOW()),
  ('Salary', 'Employee salary payments', (SELECT id FROM companies WHERE name = 'ABC Corporation'), NOW(), NOW()),
  ('Salary Advance', 'Salary advance to employees', (SELECT id FROM companies WHERE name = 'ABC Corporation'), NOW(), NOW()),
  ('Rent', 'Rent and lease payments', (SELECT id FROM companies WHERE name = 'ABC Corporation'), NOW(), NOW()),
  ('Utilities', 'Electricity, water, internet', (SELECT id FROM companies WHERE name = 'ABC Corporation'), NOW(), NOW()),
  ('Transport', 'Transportation and fuel costs', (SELECT id FROM companies WHERE name = 'ABC Corporation'), NOW(), NOW()),
  ('Food & Tea', 'Office food and beverages', (SELECT id FROM companies WHERE name = 'ABC Corporation'), NOW(), NOW()),
  ('Repairs', 'Maintenance and repairs', (SELECT id FROM companies WHERE name = 'ABC Corporation'), NOW(), NOW()),
  ('Supplies', 'Office and supply purchases', (SELECT id FROM companies WHERE name = 'ABC Corporation'), NOW(), NOW()),
  ('Other', 'Miscellaneous expenses', (SELECT id FROM companies WHERE name = 'ABC Corporation'), NOW(), NOW())
ON CONFLICT (name, "companyId") DO UPDATE SET description = EXCLUDED.description
RETURNING id, name, description;


-- ============================================================================
-- VERIFICATION - Check all created data
-- ============================================================================

-- Show Company
SELECT '=== COMPANY ===' as info;
SELECT id, name, "createdAt" FROM companies WHERE name = 'ABC Corporation';

-- Show Site
SELECT '=== SITE ===' as info;
SELECT id, name, location, "companyId" FROM sites WHERE "companyId" = (SELECT id FROM companies WHERE name = 'ABC Corporation');

-- Show Owner User
SELECT '=== OWNER USER ===' as info;
SELECT id, email, name, role, status FROM users WHERE email = 'owner@abccorp.com';

-- Show Account
SELECT '=== ACCOUNT ===' as info;
SELECT id, name, type, budget FROM accounts WHERE "companyId" = (SELECT id FROM companies WHERE name = 'ABC Corporation');

-- Show Categories
SELECT '=== CATEGORIES ===' as info;
SELECT id, name, description FROM categories WHERE "companyId" = (SELECT id FROM companies WHERE name = 'ABC Corporation') ORDER BY name;

-- Summary
SELECT '=== SUMMARY ===' as info;
SELECT 
  (SELECT COUNT(*) FROM companies WHERE name = 'ABC Corporation') as companies,
  (SELECT COUNT(*) FROM sites WHERE "companyId" = (SELECT id FROM companies WHERE name = 'ABC Corporation')) as sites,
  (SELECT COUNT(*) FROM users WHERE "companyId" = (SELECT id FROM companies WHERE name = 'ABC Corporation')) as users,
  (SELECT COUNT(*) FROM accounts WHERE "companyId" = (SELECT id FROM companies WHERE name = 'ABC Corporation')) as accounts,
  (SELECT COUNT(*) FROM categories WHERE "companyId" = (SELECT id FROM companies WHERE name = 'ABC Corporation')) as categories;

COMMIT;

-- =============================================================================
-- Login Credentials
-- =============================================================================
-- Email: owner@abccorp.com
-- Password: owner123
-- =============================================================================
