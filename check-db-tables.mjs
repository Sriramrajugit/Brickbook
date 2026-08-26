import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTables() {
  try {
    const result = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    console.log('\n📋 Tables in database:');
    result.forEach(row => console.log(`  ✓ ${row.table_name}`));
    
    console.log('\n🔍 Checking for required tables:');
    const requiredTables = [
      'partner_bills',
      'partner_bill_payments',
      'partners',
      'suppliers',
      'items'
    ];
    
    const existingTableNames = result.map(r => r.table_name);
    
    requiredTables.forEach(table => {
      const exists = existingTableNames.includes(table);
      console.log(`  ${exists ? '✅' : '❌'} ${table}`);
    });
    
  } catch (error) {
    console.error('Error checking tables:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTables();
