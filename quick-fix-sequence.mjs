import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

(async () => {
  try {
    console.log('🔧 Fixing employee ID sequence...');
    await prisma.$executeRawUnsafe('ALTER SEQUENCE employees_id_seq RESTART WITH 7');
    console.log('✅ Sequence successfully reset to 7');
    console.log('✨ You can now add new employees/partners!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();
