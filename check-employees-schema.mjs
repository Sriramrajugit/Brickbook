#!/usr/bin/env node
import { Client } from 'pg';

const DATABASE_URL = 'postgresql://postgres:DIYFzKUHTnGHTLLiOuKlpSteAuRfnGec@altaria.proxy.rlwy.net:19932/railway';

const client = new Client({ connectionString: DATABASE_URL });

async function checkSchema() {
  try {
    console.log('🔌 Connecting to Railway database...\n');
    await client.connect();

    // Check employees table schema
    console.log('📋 Employees table columns:\n');
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'employees'
      ORDER BY ordinal_position
    `);

    result.rows.forEach(col => {
      console.log(`   ${col.column_name.padEnd(25)} ${col.data_type.padEnd(15)} ${col.is_nullable === 'YES' ? '(nullable)' : '(required)'}`);
    });

    // Count employees
    const countResult = await client.query(`SELECT COUNT(*) as count FROM employees`);
    console.log(`\n📊 Total employees: ${countResult.rows[0].count}\n`);

    // Get sample data
    console.log('📝 Sample employee data:\n');
    const sampleResult = await client.query(`SELECT * FROM employees LIMIT 3`);
    sampleResult.rows.forEach((emp, idx) => {
      console.log(`   Employee ${idx + 1}:`);
      Object.entries(emp).forEach(([key, value]) => {
        console.log(`     ${key}: ${value}`);
      });
      console.log();
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

checkSchema();
