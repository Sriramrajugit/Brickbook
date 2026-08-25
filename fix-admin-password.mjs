import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.update({
      where: { email: 'admin' },
      data: {
        password: '$2b$10$oivx8QfC6ZbIbRU6quFzner78hy9URtb75oBaBRw8WA.zjCChelfG'
      }
    });

    console.log('✓ Admin user password updated successfully!');
    console.log('  Login Credentials:');
    console.log('  Username: admin');
    console.log('  Password: admin');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
