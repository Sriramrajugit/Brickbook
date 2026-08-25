import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateAdminPassword() {
  try {
    // Hash for "test123"
    const passwordHash = '$2b$10$N9qo8uLOickgx2ZMRZoMyeiPS.nWBjmEKHqLUHqBPHJHGXGAH3iJu';

    // Update admin@studio.com
    const user = await prisma.user.update({
      where: { email: 'admin@studio.com' },
      data: { password: passwordHash }
    });

    console.log('✅ Password updated for:', user.email);
    console.log('   Password: test123');
  } catch (error) {
    console.error('❌ Error updating password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminPassword();
