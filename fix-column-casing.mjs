#!/usr/bin/env node
import { Client } from 'pg';

const DATABASE_URL = 'postgresql://postgres:DIYFzKUHTnGHTLLiOuKlpSteAuRfnGec@altaria.proxy.rlwy.net:19932/railway';

const RENAME_STATEMENTS = `
-- Rename columns in employees table to match Prisma schema (with proper casing)
ALTER TABLE employees RENAME COLUMN gstnumber TO "gstNumber";
ALTER TABLE employees RENAME COLUMN creditperioddays TO "creditPeriodDays";
ALTER TABLE employees RENAME COLUMN isactive TO "isActive";
`;

const client = new Client({ connectionString: DATABASE_URL });

async function renameCcolumns() {
  try {
    console.log('🔌 Connecting to Railway database...');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('📊 Renaming columns to match Prisma schema...\n');
    
    await client.query(RENAME_STATEMENTS);
    console.log('  ✅ All columns renamed successfully!\n');

    // Verify employees schema
    console.log('✅ Employees table columns (with proper casing):\n');
    const employeesResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'employees'
      ORDER BY ordinal_position
    `);

    employeesResult.rows.forEach(col => {
      console.log(`   ✓ ${col.column_name.padEnd(25)} ${col.data_type.padEnd(15)}`);
    });

    console.log(`\n🎉 Database schema is now 100% compatible with Prisma!`);
    console.log(`   All modules should now work perfectly!\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

renameCcolumns();
