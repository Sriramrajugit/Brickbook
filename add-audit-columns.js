// Safe script to add loginTime and logoutTime columns to users table
// This won't delete any data - just adds new nullable columns

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔄 Adding audit columns to users table...');
    
    // Execute raw SQL to add columns if they don't exist
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "users" 
      ADD COLUMN IF NOT EXISTS "loginTime" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "logoutTime" TIMESTAMP(3);
    `);
    
    console.log('✅ Columns added successfully!');
    console.log('📝 New columns: loginTime, logoutTime');
    console.log('\n✨ Audit features now enabled:');
    console.log('  ✓ Login time tracking');
    console.log('  ✓ Logout time tracking');
    
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('✅ Columns already exist - no changes needed');
    } else {
      console.error('❌ Error adding columns:', error.message);
      process.exit(1);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
