import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyCredentials() {
  try {
    // Hash for "test123"
    const testHash = '$2b$10$N9qo8uLOickgx2ZMRZoMyeiPS.nWBjmEKHqLUHqBPHJHGXGAH3iJu';

    const users = await prisma.user.findMany({
      select: { id: true, email: true, password: true }
    });

    console.log('Current users in database:\n');
    for (const user of users) {
      const isTestPassword = user.password === testHash;
      console.log(`📧 ${user.email}`);
      console.log(`   Password: ${isTestPassword ? '✅ test123' : '❌ Different password'}\n`);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyCredentials();
