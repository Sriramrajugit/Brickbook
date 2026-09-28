#!/usr/bin/env node
import { Client } from 'pg';

const DATABASE_URL = 'postgresql://postgres:DIYFzKUHTnGHTLLiOuKlpSteAuRfnGec@altaria.proxy.rlwy.net:19932/railway';

const client = new Client({ connectionString: DATABASE_URL });

async function checkDatabase() {
  try {
    console.log('🔌 Connecting to Railway database...\n');
    await client.connect();

    // Get all tables
    const tablesResult = await client.query(`
      SELECT tablename FROM pg_catalog.pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    console.log(`📋 Tables in database: ${tablesResult.rows.length}\n`);
    tablesResult.rows.forEach(r => console.log(`   ✓ ${r.tablename}`));

    // Get row counts
    console.log(`\n📊 Data in tables:\n`);
    for (const { tablename } of tablesResult.rows) {
      try {
        const countResult = await client.query(`SELECT COUNT(*) as count FROM "${tablename}"`);
        const count = countResult.rows[0].count;
        console.log(`   ${tablename.padEnd(30)} ${count} rows`);
      } catch (err) {
        console.log(`   ${tablename.padEnd(30)} Error: ${err.message.substring(0, 40)}`);
      }
    }

    console.log(`\n✅ Database check complete!\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

checkDatabase();
