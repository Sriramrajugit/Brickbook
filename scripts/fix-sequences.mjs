import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixSequences() {
  try {
    console.log('Fixing database sequences...')
    
    // Fix employees sequence
    await prisma.$executeRawUnsafe(`
      SELECT setval(pg_get_serial_sequence('employees', 'id'), coalesce(max(id),0) + 1, false) FROM employees;
    `)
    
    console.log('✅ Fixed employees sequence')
    
    // You can add more sequences here if needed
    
    console.log('✅ All sequences fixed!')
  } catch (error) {
    console.error('❌ Error fixing sequences:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixSequences()
