#!/usr/bin/env node
import { Client } from 'pg';

const DATABASE_URL = 'postgresql://postgres:DIYFzKUHTnGHTLLiOuKlpSteAuRfnGec@altaria.proxy.rlwy.net:19932/railway';

const BILLING_TABLES_SQL = `
-- Create Invoice Status enum
DO $$ BEGIN
  CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Create Customers table
CREATE TABLE IF NOT EXISTS "customers" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "companyId" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "city" TEXT,
  "state" TEXT,
  "zip" TEXT,
  "gstNumber" TEXT,
  "billingAddress" TEXT,
  "paymentTerms" INTEGER DEFAULT 30,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE
);

-- Create Invoices table
CREATE TABLE IF NOT EXISTS "invoices" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "companyId" INTEGER NOT NULL,
  "customerId" INTEGER NOT NULL,
  "invoiceNumber" TEXT NOT NULL UNIQUE,
  "invoiceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dueDate" TIMESTAMP(3),
  "totalAmount" DECIMAL(18, 2) NOT NULL DEFAULT 0,
  "paidAmount" DECIMAL(18, 2) NOT NULL DEFAULT 0,
  "taxAmount" DECIMAL(18, 2) DEFAULT 0,
  "discountAmount" DECIMAL(18, 2) DEFAULT 0,
  "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
  "description" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE,
  FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT
);

-- Create Invoice Items table
CREATE TABLE IF NOT EXISTS "invoiceItems" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "invoiceId" INTEGER NOT NULL,
  "itemId" INTEGER,
  "description" TEXT NOT NULL,
  "quantity" DECIMAL(18, 2) NOT NULL,
  "unitPrice" DECIMAL(18, 2) NOT NULL,
  "taxable" BOOLEAN DEFAULT true,
  "lineTotal" DECIMAL(18, 2) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE,
  FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE SET NULL
);

-- Create Invoice Payments table
CREATE TABLE IF NOT EXISTS "invoicePayments" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "companyId" INTEGER NOT NULL,
  "invoiceId" INTEGER NOT NULL,
  "paymentDate" TIMESTAMP(3) NOT NULL,
  "amount" DECIMAL(18, 2) NOT NULL,
  "paymentMode" "PaymentMode" NOT NULL,
  "referenceNumber" TEXT,
  "transactionId" INTEGER,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE,
  FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE,
  FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE SET NULL
);

-- Create Estimates/Quotes table
CREATE TABLE IF NOT EXISTS "estimates" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "companyId" INTEGER NOT NULL,
  "customerId" INTEGER NOT NULL,
  "estimateNumber" TEXT NOT NULL UNIQUE,
  "estimateDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiryDate" TIMESTAMP(3),
  "totalAmount" DECIMAL(18, 2) NOT NULL DEFAULT 0,
  "taxAmount" DECIMAL(18, 2) DEFAULT 0,
  "discountAmount" DECIMAL(18, 2) DEFAULT 0,
  "status" TEXT DEFAULT 'PENDING',
  "description" TEXT,
  "notes" TEXT,
  "convertedToInvoiceId" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE,
  FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT,
  FOREIGN KEY ("convertedToInvoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL
);

-- Create Estimate Items table
CREATE TABLE IF NOT EXISTS "estimateItems" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "estimateId" INTEGER NOT NULL,
  "itemId" INTEGER,
  "description" TEXT NOT NULL,
  "quantity" DECIMAL(18, 2) NOT NULL,
  "unitPrice" DECIMAL(18, 2) NOT NULL,
  "taxable" BOOLEAN DEFAULT true,
  "lineTotal" DECIMAL(18, 2) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("estimateId") REFERENCES "estimates"("id") ON DELETE CASCADE,
  FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE SET NULL
);

-- Create Billing Cycles table (for recurring billing)
CREATE TABLE IF NOT EXISTS "billingCycles" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "companyId" INTEGER NOT NULL,
  "customerId" INTEGER NOT NULL,
  "cycleName" TEXT NOT NULL,
  "frequency" TEXT NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3),
  "amount" DECIMAL(18, 2) NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "nextBillingDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE,
  FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE
);

-- Create Invoices Backup/Draft table
CREATE TABLE IF NOT EXISTS "invoiceDrafts" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "companyId" INTEGER NOT NULL,
  "customerId" INTEGER,
  "draftData" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "customers_companyId_idx" ON "customers"("companyId");
CREATE INDEX IF NOT EXISTS "invoices_companyId_idx" ON "invoices"("companyId");
CREATE INDEX IF NOT EXISTS "invoices_customerId_idx" ON "invoices"("customerId");
CREATE INDEX IF NOT EXISTS "invoices_status_idx" ON "invoices"("status");
CREATE INDEX IF NOT EXISTS "invoiceItems_invoiceId_idx" ON "invoiceItems"("invoiceId");
CREATE INDEX IF NOT EXISTS "invoicePayments_invoiceId_idx" ON "invoicePayments"("invoiceId");
CREATE INDEX IF NOT EXISTS "estimates_companyId_idx" ON "estimates"("companyId");
CREATE INDEX IF NOT EXISTS "estimates_customerId_idx" ON "estimates"("customerId");
CREATE INDEX IF NOT EXISTS "estimateItems_estimateId_idx" ON "estimateItems"("estimateId");
CREATE INDEX IF NOT EXISTS "billingCycles_companyId_idx" ON "billingCycles"("companyId");
CREATE INDEX IF NOT EXISTS "billingCycles_customerId_idx" ON "billingCycles"("customerId");
`;

const client = new Client({ connectionString: DATABASE_URL });

async function createBillingTables() {
  try {
    console.log('🔌 Connecting to Railway database...');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('📊 Creating Billing & Invoice tables...\n');
    
    await client.query(BILLING_TABLES_SQL);
    console.log('  ✅ All billing & invoice tables created successfully!\n');

    // List all tables
    const result = await client.query(`
      SELECT tablename FROM pg_catalog.pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    console.log(`✅ Database now has ${result.rows.length} tables:\n`);
    
    const billingTables = ['customers', 'invoices', 'invoiceItems', 'invoicePayments', 'estimates', 'estimateItems', 'billingCycles', 'invoiceDrafts'];
    const newTables = [];
    
    result.rows.forEach(r => {
      if (billingTables.includes(r.tablename)) {
        console.log(`   ✓ ${r.tablename} (NEW - Billing)`);
        newTables.push(r.tablename);
      }
    });

    console.log(`\n📋 Other existing tables:`);
    result.rows.forEach(r => {
      if (!billingTables.includes(r.tablename)) {
        console.log(`   ✓ ${r.tablename}`);
      }
    });

    console.log(`\n🎉 Billing System Complete!`);
    console.log(`   New Billing Tables: ${newTables.length}`);
    console.log(`   - Customers: Track customer information`);
    console.log(`   - Invoices: Create and manage invoices`);
    console.log(`   - Invoice Items: Line items in invoices`);
    console.log(`   - Invoice Payments: Payment tracking`);
    console.log(`   - Estimates: Create quotes and estimates`);
    console.log(`   - Billing Cycles: Recurring billing`);
    console.log(`   - Invoice Drafts: Save draft invoices\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createBillingTables();
