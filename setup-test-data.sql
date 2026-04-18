-- Setup Test Data for Ledger Application
-- This script creates a complete test environment with users, companies, and sample data

-- 1. Create a Company
INSERT INTO "companies" (name, "createdAt", "updatedAt")
VALUES ('Studio Ullixa', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Get the company ID (assuming it's 1 if this is the first company)
-- 2. Create a Test User
-- Password: test123 (bcrypt hashed)
-- Hash: $2b$10$N9qo8uLOickgx2ZMRZoMyeiPS.nWBjmEKHqLUHqBPHJHGXGAH3iJu
INSERT INTO "User" (email, password, name, role, "companyId", status, "createdAt", "updatedAt")
VALUES 
  ('testuser', '$2b$10$N9qo8uLOickgx2ZMRZoMyeiPS.nWBjmEKHqLUHqBPHJHGXGAH3iJu', 'Test User', 'OWNER', 1, 'ACTIVE', NOW(), NOW()),
  ('admin@studio.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeiPS.nWBjmEKHqLUHqBPHJHGXGAH3iJu', 'Admin', 'OWNER', 1, 'ACTIVE', NOW(), NOW()),
  ('manager@studio.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeiPS.nWBjmEKHqLUHqBPHJHGXGAH3iJu', 'Site Manager', 'SITE_MANAGER', 1, 'ACTIVE', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- 3. Create Categories
INSERT INTO "categories" (name, type, "companyId", "createdAt", "updatedAt")
VALUES
  ('Salary', 'EXPENSE', 1, NOW(), NOW()),
  ('Rent', 'EXPENSE', 1, NOW(), NOW()),
  ('Materials', 'EXPENSE', 1, NOW(), NOW()),
  ('Income', 'INCOME', 1, NOW(), NOW()),
  ('Sales', 'INCOME', 1, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- 4. Create Accounts
INSERT INTO "accounts" (name, type, budget, address, "companyId", "createdAt", "updatedAt")
VALUES
  ('Main Project', 'Project', 500000, '123 Main Street, City, State', 1, NOW(), NOW()),
  ('Secondary Project', 'Project', 300000, '456 Oak Avenue, City, State', 1, NOW(), NOW()),
  ('Marketing Campaign', 'Campaign', 100000, NULL, 1, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- 5. Create Suppliers
INSERT INTO "suppliers" (name, email, phone, address, "companyId", "createdAt", "updatedAt")
VALUES
  ('ABC Materials', 'abc@materials.com', '9876543210', '789 Industrial Park, City', 1, NOW(), NOW()),
  ('XYZ Supplies', 'xyz@supplies.com', '9123456789', '321 Commerce Street, City', 1, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- 6. Create Employees
INSERT INTO "employees" (name, email, phone, position, "companyId", "createdAt", "updatedAt")
VALUES
  ('John Doe', 'john@studio.com', '9111111111', 'Manager', 1, NOW(), NOW()),
  ('Jane Smith', 'jane@studio.com', '9222222222', 'Supervisor', 1, NOW(), NOW()),
  ('Mike Johnson', 'mike@studio.com', '9333333333', 'Worker', 1, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- 7. Create Inventory Items
INSERT INTO "items" (name, description, "category", quantity, "unitPrice", "companyId", "createdAt", "updatedAt")
VALUES
  ('Cement Bags', 'Portland Cement 50kg bags', 'Materials', 100, 350.00, 1, NOW(), NOW()),
  ('Steel Rods', 'High strength steel rods 12mm', 'Materials', 50, 2500.00, 1, NOW(), NOW()),
  ('Bricks', 'Red clay bricks per 1000', 'Materials', 25, 4000.00, 1, NOW(), NOW()),
  ('Sand', 'Building sand per ton', 'Materials', 40, 1200.00, 1, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- 8. Create Sample Transactions
INSERT INTO "transactions" (description, amount, type, "categoryId", "accountId", "companyId", "createdAt", "updatedAt")
VALUES
  ('Monthly Salary Payment', 50000.00, 'Cash-Out', 1, 1, 1, NOW(), NOW()),
  ('Project Income Received', 100000.00, 'Cash-In', 4, 1, 1, NOW(), NOW()),
  ('Material Purchase', 35000.00, 'Cash-Out', 3, 1, 1, NOW(), NOW()),
  ('Rent Payment', 20000.00, 'Cash-Out', 2, 1, 1, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Verify the data
SELECT COUNT(*) as user_count FROM "User";
SELECT COUNT(*) as company_count FROM "companies";
SELECT COUNT(*) as category_count FROM "categories";
SELECT COUNT(*) as account_count FROM "accounts";
SELECT COUNT(*) as supplier_count FROM "suppliers";
SELECT COUNT(*) as employee_count FROM "employees";
SELECT COUNT(*) as items_count FROM "items";
SELECT COUNT(*) as transaction_count FROM "transactions";
