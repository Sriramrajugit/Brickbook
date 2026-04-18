import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  try {
    const users = await prisma.user.findMany({ select: { id: true, email: true } });
    console.log('✅ Users:', users);
    
    const accounts = await prisma.account.findMany({ take: 2, select: { id: true, name: true, city: true, state: true, zip: true } });
    console.log('✅ Accounts:', accounts);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
