import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetPassword() {
  try {
    // Hash for password "admin"
    const adminHash = '$2b$10$Ehe83JxjbB3mn8OD7l/uV.YSvvcOYd0vN0yEBgwGaU6FBoo2Cus9C';

    // Update User ID 1 with the admin password
    const user = await prisma.user.update({
      where: { id: 1 },
      data: { password: adminHash }
    });

    console.log('✅ Admin password reset successfully!');
    console.log('User ID:', user.id);
    console.log('Email:', user.email);
    console.log('\nLogin credentials:');
    console.log('User ID: 1');
    console.log('Password: admin');
  } catch (error) {
    console.error('❌ Error resetting password:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();
