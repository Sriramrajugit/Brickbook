-- =============================================================================
-- LEDGER SYSTEM - CUSTOMER ONBOARDING SQL SCRIPT
-- For: PGAdmin / Direct PostgreSQL Execution
-- =============================================================================
-- 
-- IMPORTANT: Replace the following placeholders before running:
--   - <COMPANY_NAME>      : Your company name (e.g., 'ABC Corporation')
--   - <OWNER_EMAIL>       : Owner email (e.g., 'owner@abccorp.com')
--   - <OWNER_NAME>        : Owner full name (e.g., 'ABC Owner')
--   - <HASHED_PASSWORD>   : Bcrypt hashed password (see instructions below)
--
-- PASSWORD HASHING:
--   To generate a bcrypt hash for your password, run in Node.js:
--   node -e "require('bcryptjs').hash('YourPassword123', 10).then(h => console.log(h))"
--
-- Example: Password 'owner123' hashes to:
--   $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36CHqDLG
--
-- =============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: CREATE COMPANY
-- ============================================================================
-- NOTE: Removed ID specification - PostgreSQL will auto-increment
INSERT INTO companies (name, "createdAt", "updatedAt") 
VALUES (
  '<COMPANY_NAME>',
  NOW(),
  NOW()
)
RETURNING id, name;

-- Store the COMPANY_ID from the result above for use in subsequent queries
-- Let's use variable syntax for PostgreSQL:
\set COMPANY_ID (SELECT id FROM companies WHERE name = '<COMPANY_NAME>')


-- ============================================================================
-- STEP 2: CREATE MAIN SITE
-- ============================================================================
INSERT INTO sites (name, location, "companyId", "createdAt", "updatedAt")
VALUES (
  'Main Office',
  'Headquarters',
  (SELECT id FROM companies WHERE name = '<COMPANY_NAME>'),
  NOW(),
  NOW()
)
RETURNING id, name, "companyId";

-- Store the SITE_ID from the result above
\set SITE_ID (SELECT id FROM sites WHERE name = 'Main Office' AND "companyId" = (SELECT id FROM companies WHERE name = '<COMPANY_NAME>'))


-- ============================================================================
-- STEP 3: CREATE OWNER USER
-- ============================================================================
-- Password must be bcrypt hashed!
-- Command to generate hash:
--   node -e "require('bcryptjs').hash('YourPassword123', 10).then(h => console.log(h))"
--
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
  '<OWNER_EMAIL>',
  '<OWNER_NAME>',
  '<HASHED_PASSWORD>',
  'OWNER',
  (SELECT id FROM companies WHERE name = '<COMPANY_NAME>'),
  NULL,
  'Active',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET "updatedAt" = NOW()
RETURNING id, email, name, role;

-- Store the OWNER_ID from the result above
\set OWNER_ID (SELECT id FROM users WHERE email = '<OWNER_EMAIL>')


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
  (SELECT id FROM companies WHERE name = '<COMPANY_NAME>'),
  (SELECT id FROM sites WHERE name = 'Main Office' AND "companyId" = (SELECT id FROM companies WHERE name = '<COMPANY_NAME>')),
  NOW(),
  NOW()
)
RETURNING id, name, type, budget;


-- ============================================================================
-- STEP 5: CREATE DEFAULT CATEGORIES
-- ============================================================================
INSERT INTO categories (name, description, "companyId", "createdAt", "updatedAt")
VALUES
  ('Capital', 'Initial capital and investments', (SELECT id FROM companies WHERE name = '<COMPANY_NAME>'), NOW(), NOW()),
  ('Salary', 'Employee salary payments', (SELECT id FROM companies WHERE name = '<COMPANY_NAME>'), NOW(), NOW()),
  ('Salary Advance', 'Salary advance to employees', (SELECT id FROM companies WHERE name = '<COMPANY_NAME>'), NOW(), NOW()),
  ('Rent', 'Rent and lease payments', (SELECT id FROM companies WHERE name = '<COMPANY_NAME>'), NOW(), NOW()),
  ('Utilities', 'Electricity, water, internet', (SELECT id FROM companies WHERE name = '<COMPANY_NAME>'), NOW(), NOW()),
  ('Transport', 'Transportation and fuel costs', (SELECT id FROM companies WHERE name = '<COMPANY_NAME>'), NOW(), NOW()),
  ('Food & Tea', 'Office food and beverages', (SELECT id FROM companies WHERE name = '<COMPANY_NAME>'), NOW(), NOW()),
  ('Repairs', 'Maintenance and repairs', (SELECT id FROM companies WHERE name = '<COMPANY_NAME>'), NOW(), NOW()),
  ('Supplies', 'Office and supply purchases', (SELECT id FROM companies WHERE name = '<COMPANY_NAME>'), NOW(), NOW()),
  ('Other', 'Miscellaneous expenses', (SELECT id FROM companies WHERE name = '<COMPANY_NAME>'), NOW(), NOW())
ON CONFLICT (name, "companyId") DO UPDATE SET description = EXCLUDED.description
RETURNING id, name, description;


-- ============================================================================
-- VERIFICATION QUERIES - Run these to verify data was created
-- ============================================================================

-- Check company
SELECT 'COMPANY' as type, id, name FROM companies WHERE name = '<COMPANY_NAME>';

-- Check sites
SELECT 'SITE' as type, id, name, location FROM sites WHERE "companyId" = (SELECT id FROM companies WHERE name = '<COMPANY_NAME>');

-- Check owner user
SELECT 'USER' as type, id, email, name, role FROM users WHERE email = '<OWNER_EMAIL>';

-- Check accounts
SELECT 'ACCOUNT' as type, id, name, type, budget FROM accounts WHERE "companyId" = (SELECT id FROM companies WHERE name = '<COMPANY_NAME>');

-- Check categories count
SELECT 'CATEGORIES' as type, COUNT(*) as count FROM categories WHERE "companyId" = (SELECT id FROM companies WHERE name = '<COMPANY_NAME>');

-- List all categories
SELECT 'CATEGORY' as type, id, name, description FROM categories WHERE "companyId" = (SELECT id FROM companies WHERE name = '<COMPANY_NAME>');

COMMIT;

-- =============================================================================
-- SUMMARY
-- =============================================================================
-- Company has been successfully onboarded!
-- Login with:
--   Email: <OWNER_EMAIL>
--   Password: (the original password you hashed)
-- =============================================================================
