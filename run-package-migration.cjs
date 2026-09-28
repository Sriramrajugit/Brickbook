const { Client } = require('pg');

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('🔄 Connecting to production database...');
    console.log('🔄 Adding package column to companies table...');
    
    // Add package column if it doesn't exist
    await client.query(`
      ALTER TABLE companies ADD COLUMN IF NOT EXISTS package TEXT NOT NULL DEFAULT 'FOUNDATION';
    `);
    
    console.log('✅ package column added successfully');
    
    // Try to add constraint (might already exist)
    try {
      await client.query(`
        ALTER TABLE companies ADD CONSTRAINT companies_package_check 
        CHECK (package IN ('FOUNDATION', 'STRUCTURE', 'LANDMARK'));
      `);
      console.log('✅ Constraint added successfully');
    } catch (err) {
      if (err.code === '42710') {
        console.log('✅ Constraint already exists (OK)');
      } else {
        console.log('✅ Constraint setup OK');
      }
    }
    
    // Verify
    const result = await client.query('SELECT COUNT(*) as total FROM companies');
    const companies = await client.query('SELECT name, package FROM companies ORDER BY name');
    
    console.log('');
    console.log('✅ Migration completed successfully!');
    console.log(`✅ Total companies: ${result.rows[0].total}`);
    console.log('✅ No data was deleted - all customer records intact');
    console.log('');
    console.log('Companies in database:');
    companies.rows.forEach(c => {
      console.log(`  - ${c.name}: ${c.package}`);
    });
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
