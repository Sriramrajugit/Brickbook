#!/usr/bin/env node
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

const DATABASE_URL = 'postgresql://postgres:DIYFzKUHTnGHTLLiOuKlpSteAuRfnGec@altaria.proxy.rlwy.net:19932/railway';
const BACKUP_FILE = 'C:\\My Data\\Workspace\\DB_BK\\Railway_Aug_25_bk.sql';

console.log('📦 Step 1: Restoring backup to Railway...');
console.log(`📁 Reading: ${BACKUP_FILE}\n`);

const client = new Client({ connectionString: DATABASE_URL });

async function restore() {
  try {
    console.log('🔌 Connecting to Railway database...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Read backup file
    console.log('📄 Reading backup file...');
    const sqlContent = fs.readFileSync(BACKUP_FILE, 'utf8');
    console.log(`✅ Backup file loaded (${(sqlContent.length / 1024 / 1024).toFixed(2)} MB)\n`);

    // Split by statement and execute
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📊 Found ${statements.length} SQL statements\n`);
    console.log('🔄 Executing restoration...\n');

    let executed = 0;
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i] + ';';
      try {
        await client.query(stmt);
        executed++;
        if (executed % 50 === 0) {
          console.log(`  ✅ Executed ${executed}/${statements.length} statements...`);
        }
      } catch (err) {
        // Skip errors for existing objects
        if (!err.message.includes('already exists') && 
            !err.message.includes('duplicate') &&
            !err.message.includes('no relation')) {
          console.log(`  ⚠️  Statement ${i}: ${err.message.substring(0, 60)}`);
        }
      }
    }

    console.log(`\n✅ Restoration complete!`);
    console.log(`   Executed: ${executed}/${statements.length} statements\n`);

    // Check tables
    const result = await client.query(`
      SELECT tablename FROM pg_catalog.pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    console.log(`📋 Tables in database: ${result.rows.length}\n`);
    result.rows.forEach(r => console.log(`   • ${r.tablename}`));

  } catch (error) {
    console.error('❌ Restoration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

restore();
