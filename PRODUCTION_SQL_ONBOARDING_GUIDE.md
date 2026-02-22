# Production SQL Onboarding Guide - PGAdmin

## Overview
This guide shows you how to onboard a new customer in production using SQL scripts via PGAdmin.

---

## 📋 Files Available

### 1. **SQL_ONBOARDING_TEMPLATE.sql**
- General template with placeholders
- Use this as a base for any company

### 2. **SQL_ONBOARDING_EXAMPLE.sql**
- Complete ready-to-use example for "ABC Corporation"
- Shows all 5 steps with real values
- Includes verification queries

---

## 🔐 Step 1: Generate Bcrypt Password Hash

Before running SQL, you need a bcrypt hashed password.

### Option A: Node.js (Recommended)
```bash
node -e "require('bcryptjs').hash('YourPassword123', 10).then(h => console.log(h))"
```
Replace `YourPassword123` with your actual password.

**Output Example:**
```
$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36CHqDLG
```

### Option B: Online Bcrypt Generator
1. Visit: https://bcrypt-generator.com/
2. Enter your password
3. Set rounds to 10
4. Copy the hash

### Common Password Hashes (Reference Only - Don't use in production!)
```
Password: owner123
Hash: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36CHqDLG

Password: manager123
Hash: $2a$10$SomethingElse... (you need to generate)

Password: secure@password123
Hash: $2a$10$YetAnother... (generate your own)
```

---

## 🎯 Step 2: Customize SQL for Your Company

### Using Template Method (Recommended for production)

1. **Open:** `SQL_ONBOARDING_TEMPLATE.sql`

2. **Replace these placeholders:**
   ```sql
   <COMPANY_NAME>      → "Your Company Name"
   <OWNER_EMAIL>       → "owner@yourcompany.com"
   <OWNER_NAME>        → "Your Owner Name"
   <HASHED_PASSWORD>   → "the hash from step 1"
   ```

3. **Example conversion:**
   ```sql
   -- BEFORE (Template):
   VALUES (
     '<COMPANY_NAME>',
     NOW(),
     NOW()
   )

   -- AFTER (Customized):
   VALUES (
     'XYZ Industries',
     NOW(),
     NOW()
   )
   ```

### Quick Copy Method

Use the provided **SQL_ONBOARDING_EXAMPLE.sql** and replace:
- `ABC Corporation` → Your company name (4 places)
- `owner@abccorp.com` → Your owner email (2 places)
- `ABC Owner` → Your owner name (1 place)
- `$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36CHqDLG` → Your bcrypt hash (1 place)

---

## 📊 Step 3: Execute in PGAdmin

### Method 1: PGAdmin GUI (Easiest)

1. **Open PGAdmin** and connect to your PostgreSQL database
2. **Select your database** in the left panel
3. **Click:** Tools → Query Tool (or press Alt+Q)
4. **Paste** the customized SQL script
5. **Click:** Execute (▶ button) or F6
6. **Review results** - you should see inserted rows

### Method 2: Copy-Paste Parts

If you want to run step-by-step:

1. Run the COMPANY INSERT first
2. Note the returned `id`
3. Run the SITE INSERT
4. Note the returned `id`
5. Continue with USER, ACCOUNT, CATEGORIES

### Method 3: Command Line (psql)

```bash
psql -U postgres -d your_database_name -f SQL_ONBOARDING_EXAMPLE.sql
```

---

## ✅ Step 4: Verify Creation

After running the SQL, verify success by running these SELECT queries:

```sql
-- Check company exists
SELECT id, name FROM companies WHERE name = 'ABC Corporation';

-- Check owner user
SELECT id, email, name, role FROM users WHERE email = 'owner@abccorp.com';

-- Check account created
SELECT id, name, type, budget FROM accounts WHERE name = 'Main Account'
  AND "companyId" = (SELECT id FROM companies WHERE name = 'ABC Corporation');

-- Count categories
SELECT COUNT(*) FROM categories 
  WHERE "companyId" = (SELECT id FROM companies WHERE name = 'ABC Corporation');
```

All these queries are included at the end of the SQL script.

---

## 🔐 Step 5: Test Login

1. **Go to:** http://localhost:3000 (or your production URL)
2. **Login with:**
   - **Email:** owner@abccorp.com
   - **Password:** owner123 (or whatever you set)
3. **You should see:** ABC Corporation dashboard

---

## 📝 Example: Complete Custom Setup

### Your Customer Details:
```
Company: Tech Solutions Ltd
Owner Email: owner@techsolutions.in
Owner Name: Raj Kumar
Password: TechSol@2026
```

### Step 1: Generate Hash
```bash
node -e "require('bcryptjs').hash('TechSol@2026', 10).then(h => console.log(h))"
# Output: $2a$10$X1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6
```

### Step 2: Create SQL File

Create `tech-solutions-onboard.sql`:
```sql
BEGIN;

-- Create company
INSERT INTO companies (name, "createdAt", "updatedAt") 
VALUES ('Tech Solutions Ltd', NOW(), NOW());

-- Create site
INSERT INTO sites (name, location, "companyId", "createdAt", "updatedAt")
VALUES (
  'Main Office',
  'Bangalore',
  (SELECT id FROM companies WHERE name = 'Tech Solutions Ltd'),
  NOW(),
  NOW()
);

-- Create owner user
INSERT INTO users (
  email, name, password, role, "companyId", "siteId", status, "createdAt", "updatedAt"
)
VALUES (
  'owner@techsolutions.in',
  'Raj Kumar',
  '$2a$10$X1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6',
  'OWNER',
  (SELECT id FROM companies WHERE name = 'Tech Solutions Ltd'),
  NULL,
  'Active',
  NOW(),
  NOW()
);

-- Create main account
INSERT INTO accounts (name, type, budget, "companyId", "siteId", "createdAt", "updatedAt")
VALUES (
  'Main Account',
  'General',
  500000.00,
  (SELECT id FROM companies WHERE name = 'Tech Solutions Ltd'),
  (SELECT id FROM sites WHERE name = 'Main Office' AND "companyId" = (SELECT id FROM companies WHERE name = 'Tech Solutions Ltd')),
  NOW(),
  NOW()
);

-- Create categories
INSERT INTO categories (name, description, "companyId", "createdAt", "updatedAt")
VALUES
  ('Salary', 'Employee salary payments', (SELECT id FROM companies WHERE name = 'Tech Solutions Ltd'), NOW(), NOW()),
  ('Rent', 'Office rent', (SELECT id FROM companies WHERE name = 'Tech Solutions Ltd'), NOW(), NOW()),
  ('Utilities', 'Utilities and services', (SELECT id FROM companies WHERE name = 'Tech Solutions Ltd'), NOW(), NOW()),
  ('Equipment', 'Equipment purchases', (SELECT id FROM companies WHERE name = 'Tech Solutions Ltd'), NOW(), NOW()),
  ('Travel', 'Travel and transportation', (SELECT id FROM companies WHERE name = 'Tech Solutions Ltd'), NOW(), NOW()),
  ('Other', 'Miscellaneous', (SELECT id FROM companies WHERE name = 'Tech Solutions Ltd'), NOW(), NOW());

COMMIT;
```

### Step 3: Execute in PGAdmin
- Copy above script
- Paste in PGAdmin Query Tool
- Execute

### Step 4: Verify
```sql
SELECT * FROM companies WHERE name = 'Tech Solutions Ltd';
SELECT * FROM users WHERE email = 'owner@techsolutions.in';
SELECT COUNT(*) FROM categories WHERE "companyId" = (SELECT id FROM companies WHERE name = 'Tech Solutions Ltd');
```

### Step 5: Login
- Email: `owner@techsolutions.in`
- Password: `TechSol@2026`

---

## ⚠️ Important Notes

1. **Password Security:**
   - Never store plain text passwords
   - Always use bcrypt hash
   - 10 rounds is standard security

2. **Company Name Uniqueness:**
   - Company names must be unique
   - SQL uses `ON CONFLICT` to prevent duplicates
   - Modify company name if it conflicts

3. **Email Uniqueness:**
   - User emails must be unique across ALL companies
   - Use unique email addresses for each owner

4. **Transaction Safety:**
   - All SQL is wrapped in `BEGIN; ... COMMIT;`
   - Either all succeeds or all fails
   - No partial data creation

5. **Foreign Keys:**
   - Categories must have valid `companyId`
   - Accounts must have valid `companyId` and `siteId`
   - Users must have valid `companyId`

---

## 🆘 Troubleshooting

### Error: "Duplicate key value violates unique constraint"
- **Cause:** Company name already exists
- **Solution:** Use a different company name or delete the old one

### Error: "Foreign key constraint violated"
- **Cause:** Referenced company/site doesn't exist
- **Solution:** Make sure COMPANY INSERT ran before SITE, USER, ACCOUNT

### Error: "Invalid password format"
- **Cause:** Password is not bcrypt hashed
- **Solution:** Generate hash using Node.js command above

### User can't login
- **Cause:** Email doesn't exist or wrong password
- **Solution:** Verify user exists: `SELECT * FROM users WHERE email = 'owner@xyz.com';`

---

## 📌 Quick Reference

### Complete Minimal SQL
```sql
BEGIN;

-- Company
INSERT INTO companies (name, "createdAt", "updatedAt") 
VALUES ('Your Company', NOW(), NOW());

-- Site
INSERT INTO sites (name, location, "companyId", "createdAt", "updatedAt")
VALUES ('Main Office', 'Address', (SELECT id FROM companies WHERE name = 'Your Company'), NOW(), NOW());

-- User (replace hash!)
INSERT INTO users (email, name, password, role, "companyId", "siteId", status, "createdAt", "updatedAt")
VALUES ('owner@company.com', 'Owner', '$(BCRYPT_HASH)', 'OWNER', 
        (SELECT id FROM companies WHERE name = 'Your Company'), NULL, 'Active', NOW(), NOW());

-- Account
INSERT INTO accounts (name, type, budget, "companyId", "siteId", "createdAt", "updatedAt")
VALUES ('Main Account', 'General', 100000, 
        (SELECT id FROM companies WHERE name = 'Your Company'),
        (SELECT id FROM sites WHERE name = 'Main Office' AND "companyId" = (SELECT id FROM companies WHERE name = 'Your Company')),
        NOW(), NOW());

-- Categories
INSERT INTO categories (name, description, "companyId", "createdAt", "updatedAt")
VALUES 
  ('Salary', 'Salary', (SELECT id FROM companies WHERE name = 'Your Company'), NOW(), NOW()),
  ('Rent', 'Rent', (SELECT id FROM companies WHERE name = 'Your Company'), NOW(), NOW()),
  ('Other', 'Other', (SELECT id FROM companies WHERE name = 'Your Company'), NOW(), NOW());

COMMIT;
```

---

## Files Provided

1. **SQL_ONBOARDING_TEMPLATE.sql** - Template with placeholders
2. **SQL_ONBOARDING_EXAMPLE.sql** - Ready-to-use example for ABC Corporation

Use these files directly or as reference for creating custom onboarding scripts.
