-- Create ENUM type for UserRole
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'SITE_MANAGER', 'GUEST');

-- Create companies table
CREATE TABLE "companies" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Create sites table
CREATE TABLE "sites" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "location" TEXT,
  "companyId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "sites_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "sites_companyId_idx" ON "sites"("companyId");

-- Create users table
CREATE TABLE "users" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "email" TEXT UNIQUE,
  "name" TEXT,
  "password" TEXT,
  "role" "UserRole" NOT NULL DEFAULT 'GUEST',
  "companyId" INTEGER NOT NULL,
  "siteId" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "logoutTime" TIMESTAMP(3),
  CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "users_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "users_companyId_idx" ON "users"("companyId");

-- Create accounts table
CREATE TABLE "accounts" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'General',
  "budget" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "companyId" INTEGER NOT NULL,
  "siteId" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "accounts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "accounts_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "accounts_companyId_idx" ON "accounts"("companyId");

-- Create categories table
CREATE TABLE "categories" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "companyId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "categories_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "categories_name_companyId_key" UNIQUE("name", "companyId")
);

CREATE INDEX "categories_companyId_idx" ON "categories"("companyId");

-- Create transactions table
CREATE TABLE "transactions" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "amount" DOUBLE PRECISION NOT NULL,
  "description" TEXT,
  "category" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "paymentMode" TEXT NOT NULL DEFAULT 'G-Pay',
  "date" TIMESTAMP(3) NOT NULL,
  "accountId" INTEGER NOT NULL,
  "categoryId" INTEGER,
  "createdBy" INTEGER,
  "companyId" INTEGER NOT NULL,
  "siteId" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "transactions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "transactions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "transactions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "transactions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "transactions_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "transactions_companyId_idx" ON "transactions"("companyId");
CREATE INDEX "transactions_siteId_idx" ON "transactions"("siteId");

-- Create employees table
CREATE TABLE "employees" (
  "companyId" INTEGER NOT NULL,
  "id" SERIAL NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "etype" TEXT,
  "salary" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'Active',
  CONSTRAINT "employees_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create attendances table
CREATE TABLE "attendances" (
  "companyId" INTEGER NOT NULL,
  "id" SERIAL NOT NULL PRIMARY KEY,
  "employeeId" INTEGER NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL,
  CONSTRAINT "attendances_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "attendances_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "attendances_employeeId_date_key" UNIQUE("employeeId", "date")
);

-- Create payrolls table
CREATE TABLE "payrolls" (
  "companyId" INTEGER NOT NULL,
  "id" SERIAL NOT NULL PRIMARY KEY,
  "employeeId" INTEGER NOT NULL,
  "accountId" INTEGER NOT NULL,
  "fromDate" TIMESTAMP(3) NOT NULL,
  "toDate" TIMESTAMP(3) NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "remarks" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "payrolls_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "payrolls_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create advances table
CREATE TABLE "advances" (
  "companyId" INTEGER NOT NULL,
  "id" SERIAL NOT NULL PRIMARY KEY,
  "employeeId" INTEGER NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "reason" TEXT,
  "date" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "advances_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "advances_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create migrations table for Prisma
CREATE TABLE "_prisma_migrations" (
  "id" VARCHAR(36) NOT NULL PRIMARY KEY,
  "checksum" VARCHAR(64) NOT NULL,
  "finished_at" TIMESTAMP(3),
  "migration_name" VARCHAR(255) NOT NULL,
  "logs" TEXT,
  "rolled_back_at" TIMESTAMP(3),
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "applied_steps_count" INTEGER NOT NULL DEFAULT 0
);

-- ===== INSERT INITIAL DATA =====

-- Insert default company
INSERT INTO "companies" ("name", "createdAt", "updatedAt") 
VALUES ('Default Company', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Insert default user with hashed password for 'admin'
-- Password hash: $2a$10$....... (bcrypt hash of 'admin')
INSERT INTO "users" ("id", "email", "name", "password", "role", "companyId", "createdAt", "updatedAt")
VALUES (1, 'owner@uliixa.com', 'Owner', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36CHqDLG', 'OWNER', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Insert default account
INSERT INTO "accounts" ("name", "type", "budget", "companyId", "createdAt", "updatedAt")
VALUES ('Main Account', 'General', 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Insert default categories
INSERT INTO "categories" ("name", "companyId", "createdAt", "updatedAt")
VALUES 
  ('Capital', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('Salary', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('Salary Advance', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('Rent', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('Utilities', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('Other', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;
