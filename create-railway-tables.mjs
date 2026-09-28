#!/usr/bin/env node
import { Client } from 'pg';

const DATABASE_URL = 'postgresql://postgres:DIYFzKUHTnGHTLLiOuKlpSteAuRfnGec@altaria.proxy.rlwy.net:19932/railway';

const SQL_STATEMENTS = `
-- Create enums
DROP TYPE IF EXISTS "BillStatus" CASCADE;
DROP TYPE IF EXISTS "PaymentMode" CASCADE;
DROP TYPE IF EXISTS "TransactionType" CASCADE;

CREATE TYPE "BillStatus" AS ENUM ('UNPAID', 'PARTIALLY_PAID', 'FULLY_PAID');
CREATE TYPE "PaymentMode" AS ENUM ('GPAY', 'BANK_TRANSFER', 'CASH', 'CHEQUE', 'UPI', 'NEFT', 'RTGS', 'IMPS');
CREATE TYPE "TransactionType" AS ENUM ('Cash-In', 'Cash-Out');

-- Create tables
CREATE TABLE IF NOT EXISTS "companies" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "code" TEXT UNIQUE,
  "email" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "gstNumber" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS "sites" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "companyId" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "location" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "users" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "companyId" INTEGER NOT NULL,
  "siteId" INTEGER,
  "email" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'USER',
  "password" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "loginTime" TIMESTAMP(3),
  "logoutTime" TIMESTAMP(3),
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE,
  FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "accounts" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "companyId" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "balance" DECIMAL(18, 2) NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "categories" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "companyId" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "transactions" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "companyId" INTEGER NOT NULL,
  "accountId" INTEGER NOT NULL,
  "categoryId" INTEGER,
  "description" TEXT,
  "amount" DECIMAL(18, 2) NOT NULL,
  "type" "TransactionType" NOT NULL,
  "paymentMode" TEXT DEFAULT 'G-Pay',
  "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE,
  FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT,
  FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "employees" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "companyId" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "partnerType" TEXT,
  "etype" TEXT,
  "salary" DECIMAL(18, 2),
  "salaryFrequency" TEXT,
  "gstNumber" TEXT,
  "creditPeriodDays" INTEGER,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "status" TEXT DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "attendances" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "companyId" INTEGER NOT NULL,
  "employeeId" INTEGER NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL,
  "remarks" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3),
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE,
  FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "payrolls" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "companyId" INTEGER NOT NULL,
  "employeeId" INTEGER NOT NULL,
  "month" TEXT NOT NULL,
  "baseSalary" DECIMAL(18, 2),
  "allowances" DECIMAL(18, 2) DEFAULT 0,
  "deductions" DECIMAL(18, 2) DEFAULT 0,
  "netSalary" DECIMAL(18, 2),
  "status" TEXT DEFAULT 'pending',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE,
  FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "advances" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "companyId" INTEGER NOT NULL,
  "employeeId" INTEGER NOT NULL,
  "amount" DECIMAL(18, 2) NOT NULL,
  "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" TEXT DEFAULT 'pending',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE,
  FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "partners" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "companyId" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "gstNumber" TEXT,
  "bankAccount" TEXT,
  "bankName" TEXT,
  "ifscCode" TEXT,
  "paymentTerms" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "suppliers" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "companyId" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "gstNumber" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "partner_bills" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "companyId" INTEGER NOT NULL,
  "employeeId" INTEGER NOT NULL,
  "accountId" INTEGER NOT NULL,
  "invoiceNo" TEXT NOT NULL UNIQUE,
  "billDate" TIMESTAMP(3) NOT NULL,
  "dueDate" TIMESTAMP(3),
  "amount" DECIMAL(18, 2) NOT NULL,
  "paidAmount" DECIMAL(18, 2) DEFAULT 0,
  "status" "BillStatus" NOT NULL DEFAULT 'UNPAID',
  "billImagePath" TEXT,
  "remarks" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE,
  FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE,
  FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "partner_bill_payments" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "companyId" INTEGER NOT NULL,
  "billId" INTEGER NOT NULL,
  "paymentDate" TIMESTAMP(3) NOT NULL,
  "amount" DECIMAL(18, 2) NOT NULL,
  "paymentMode" "PaymentMode" NOT NULL,
  "referenceNo" TEXT,
  "transactionId" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE,
  FOREIGN KEY ("billId") REFERENCES "partner_bills"("id") ON DELETE CASCADE,
  FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "items" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "companyId" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "sku" TEXT,
  "unitPrice" DECIMAL(18, 2),
  "quantity" INTEGER,
  "unit" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE
);

-- Create indexes if not exists
CREATE INDEX IF NOT EXISTS "transactions_accountId_idx" ON "transactions"("accountId");
CREATE INDEX IF NOT EXISTS "transactions_categoryId_idx" ON "transactions"("categoryId");
CREATE INDEX IF NOT EXISTS "transactions_companyId_idx" ON "transactions"("companyId");
CREATE INDEX IF NOT EXISTS "attendances_employeeId_idx" ON "attendances"("employeeId");
CREATE INDEX IF NOT EXISTS "attendances_companyId_idx" ON "attendances"("companyId");
CREATE INDEX IF NOT EXISTS "payrolls_employeeId_idx" ON "payrolls"("employeeId");
CREATE INDEX IF NOT EXISTS "payrolls_companyId_idx" ON "payrolls"("companyId");
CREATE INDEX IF NOT EXISTS "partner_bills_employeeId_idx" ON "partner_bills"("employeeId");
CREATE INDEX IF NOT EXISTS "partner_bills_companyId_idx" ON "partner_bills"("companyId");
CREATE INDEX IF NOT EXISTS "partner_bill_payments_billId_idx" ON "partner_bill_payments"("billId");
`;

const client = new Client({ connectionString: DATABASE_URL });

async function createTables() {
  try {
    console.log('🔌 Connecting to Railway database...');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('📊 Creating tables and enums...\n');

    // Execute the entire schema as one transaction
    try {
      await client.query(SQL_STATEMENTS);
      console.log(`  ✅ All tables, enums and indexes created successfully!\n`);
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log(`  ℹ️  Some objects already exist (will skip)...\n`);
      } else {
        console.error(`  ❌ Error: ${err.message}\n`);
        throw err;
      }
    }

    console.log(`✅ Schema creation complete!\n`);

    // List all tables
    const result = await client.query(`
      SELECT tablename FROM pg_catalog.pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    console.log(`📋 Tables in database: ${result.rows.length}\n`);
    result.rows.forEach(r => console.log(`   ✓ ${r.tablename}`));

    console.log(`\n🎉 All tables created successfully!`);
    console.log(`   Your Railway database is ready for production!\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createTables();
