import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixSequence() {
  try {
    console.log('🔍 Checking Employee table...');
    
    // Get the max ID currently in the table
    const maxEmployee = await prisma.$queryRawUnsafe('SELECT MAX(id) as maxId FROM employees');
    const maxId = maxEmployee[0]?.maxId || 0;
    
    console.log(`📊 Current max Employee ID in database: ${maxId}`);
    
    // Reset the sequence to be the max ID + 1
    const nextId = maxId + 1;
    
    // For PostgreSQL, use ALTER SEQUENCE
    await prisma.$executeRawUnsafe(`ALTER SEQUENCE employees_id_seq RESTART WITH ${nextId}`);
    
    console.log(`✅ Employee ID sequence reset to start at ${nextId}`);
    
    // Verify
    const checkEmployee = await prisma.$queryRawUnsafe('SELECT MAX(id) as maxId FROM employees');
    console.log(`✨ Verification - Max ID now: ${checkEmployee[0]?.maxId}`);
    
    console.log('✅ Sequence fix complete! You can now add new employees.');
  } catch (error) {
    console.error('❌ Error fixing sequence:', error.message);
    if (error.message.includes('does not exist')) {
      console.log('ℹ️  The sequence may not exist. Try creating a test employee to auto-initialize it.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

fixSequence();
