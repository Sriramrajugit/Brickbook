import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Pre-hashed password for test123
    const user = await prisma.user.create({
      data: {
        email: 'testuser',
        password: '$2b$10$N9qo8uLOickgx2ZMRZoMyeiPS.nWBjmEKHqLUHqBPHJHGXGAH3iJu',
        name: 'Test User',
        role: 'OWNER',
        companyId: 1,
      },
    });

    console.log('✓ User created successfully!');
    console.log('  Login Credentials:');
    console.log('  Username: testuser');
    console.log('  Password: test123');
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('✓ User already exists!');
      console.log('  Login Credentials:');
      console.log('  Username: testuser');
      console.log('  Password: test123');
    } else {
      console.error('Error:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
