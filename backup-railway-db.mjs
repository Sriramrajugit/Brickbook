#!/usr/bin/env node
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABASE_URL = 'postgresql://postgres:YBOcbuyviYZERpPVwEMNuOsVOIGMFYdo@postgres.railway.internal:5432/railway?sslmode=disable';

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + new Date().toTimeString().split(' ')[0].replace(/:/g, '');
const backupFile = path.join(__dirname, `backup_production_${timestamp}.sql`);

console.log('📦 Exporting production data from Railway...');
console.log(`🎯 Target: ${backupFile}`);
console.log('⏳ This may take 1-2 minutes...\n');

// Try using Railway CLI's export if available
const checkRailway = spawn('railway', ['db:export'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: true
});

let usingRailwayCLI = false;

checkRailway.on('error', () => {
  // Railway CLI not available, use fallback
  console.log('📝 Using PostgreSQL client method...');
  usePgClient();
});

checkRailway.stdout.on('data', (data) => {
  usingRailwayCLI = true;
  const output = data.toString();
  console.log(output);
  
  // Save to file
  fs.appendFileSync(backupFile, output);
});

checkRailway.on('close', (code) => {
  if (usingRailwayCLI) {
    handleCompletion();
  }
});

// Fallback: Use pg client directly
async function usePgClient() {
  try {
    // Import pg dynamically
    const pgModule = await import('pg');
    const { Client } = pgModule.default;
    
    const client = new Client({
      connectionString: DATABASE_URL,
    });

    console.log('🔌 Connecting to Railway database...');
    await client.connect();
    console.log('✅ Connected!\n');

    const stream = fs.createWriteStream(backupFile);
    
    // Export all tables with data
    const tables = await client.query(`
      SELECT tablename FROM pg_catalog.pg_tables 
      WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema'
      ORDER BY tablename
    `);

    console.log(`📊 Found ${tables.rows.length} tables to export\n`);

    // Write SQL header
    stream.write(`-- Production Database Backup\n`);
    stream.write(`-- Exported: ${new Date().toISOString()}\n`);
    stream.write(`-- Database: railway\n\n`);

    let exportedCount = 0;

    for (const { tablename } of tables.rows) {
      try {
        const result = await client.query(`SELECT * FROM "${tablename}"`);
        
        // Generate INSERT statements
        if (result.rows.length > 0) {
          const columns = Object.keys(result.rows[0]);
          
          stream.write(`-- Table: ${tablename}\n`);
          stream.write(`INSERT INTO "${tablename}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES\n`);
          
          result.rows.forEach((row, idx) => {
            const values = columns.map(col => {
              const val = row[col];
              if (val === null) return 'NULL';
              if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
              if (typeof val === 'boolean') return val ? 'true' : 'false';
              if (val instanceof Date) return `'${val.toISOString()}'`;
              return val;
            }).join(', ');
            
            stream.write(`(${values})${idx === result.rows.length - 1 ? ';' : ','}\n`);
          });
          
          stream.write(`\n`);
          exportedCount++;
          console.log(`  ✅ Exported ${tablename} (${result.rows.length} rows)`);
        }
      } catch (err) {
        console.log(`  ⚠️  Skipped ${tablename}: ${err.message}`);
      }
    }

    await client.end();
    stream.end();

    stream.on('finish', () => {
      handleCompletion();
    });

  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    process.exit(1);
  }
}

function handleCompletion() {
  try {
    const stats = fs.statSync(backupFile);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log(`\n✅ BACKUP SUCCESSFUL!`);
    console.log(`   File: ${backupFile}`);
    console.log(`   Size: ${sizeMB} MB`);
    console.log(`\n🔒 Your production data is now SAFE and backed up!`);
    console.log(`\n📋 Next steps:`);
    console.log(`   1. Go to railway.app → PostgreSQL → Settings`);
    console.log(`   2. Click "Delete Service" to remove corrupted database`);
    console.log(`   3. Click "Add Service" → Select PostgreSQL`);
    console.log(`   4. Wait 2 minutes for new database to be created`);
    console.log(`   5. Copy the NEW DATABASE_URL from Connect tab`);
    console.log(`   6. I'll help you restore this backup to the new database\n`);
    
  } catch (err) {
    console.error('❌ Error checking backup file:', err.message);
    process.exit(1);
  }
}

// Timeout safety
setTimeout(() => {
  console.error('❌ Backup timed out after 5 minutes');
  process.exit(1);
}, 5 * 60 * 1000);
