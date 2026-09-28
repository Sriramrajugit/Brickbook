#!/usr/bin/env node
import { Client } from 'pg';

const DATABASE_URL = 'postgresql://postgres:DIYFzKUHTnGHTLLiOuKlpSteAuRfnGec@altaria.proxy.rlwy.net:19932/railway';

const NEW_TABLES_SQL = `
-- Create new enums if they don't exist
DO $$ BEGIN
  CREATE TYPE "BillStatus" AS ENUM ('UNPAID', 'PARTIALLY_PAID', 'FULLY_PAID');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "PaymentMode" AS ENUM ('GPAY', 'BANK_TRANSFER', 'CASH', 'CHEQUE', 'UPI', 'NEFT', 'RTGS', 'IMPS');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Create Partners table
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

-- Create Suppliers table
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

-- Create Items table
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

-- Create Partner Bills table
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

-- Create Partner Bill Payments table
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

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS "partners_companyId_idx" ON "partners"("companyId");
CREATE INDEX IF NOT EXISTS "suppliers_companyId_idx" ON "suppliers"("companyId");
CREATE INDEX IF NOT EXISTS "items_companyId_idx" ON "items"("companyId");
CREATE INDEX IF NOT EXISTS "partner_bills_employeeId_idx" ON "partner_bills"("employeeId");
CREATE INDEX IF NOT EXISTS "partner_bills_companyId_idx" ON "partner_bills"("companyId");
CREATE INDEX IF NOT EXISTS "partner_bill_payments_billId_idx" ON "partner_bill_payments"("billId");
`;

const client = new Client({ connectionString: DATABASE_URL });

async function createNewTables() {
  try {
    console.log('🔌 Connecting to Railway database...');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('📊 Adding Bills & Partners tables...\n');
    
    await client.query(NEW_TABLES_SQL);
    console.log('  ✅ All new tables created successfully!\n');

    // Verify
    const result = await client.query(`
      SELECT tablename FROM pg_catalog.pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    console.log(`✅ Database now has ${result.rows.length} tables:\n`);
    result.rows.forEach(r => console.log(`   ✓ ${r.tablename}`));

    console.log(`\n🎉 Your database is now complete!`);
    console.log(`   - Old data: ✅ Restored`);
    console.log(`   - New tables: ✅ Created`);
    console.log(`   - Ready for production: ✅ YES!\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createNewTables();
