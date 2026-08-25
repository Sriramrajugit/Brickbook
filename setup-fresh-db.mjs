import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Create company first
    let company = await prisma.company.findFirst({
      where: { name: 'Default Company' }
    });

    if (!company) {
      company = await prisma.company.create({
        data: {
          name: 'Default Company'
        }
      });
      console.log('✓ Company created successfully!');
    } else {
      console.log('✓ Company already exists!');
    }

    // Create admin user
    const user = await prisma.user.create({
      data: {
        email: 'admin',
        password: '$2b$10$N9qo8uLOickgx2ZMRZoMyeiPS.nWBjmEKHqLUHqBPHJHGXGAH3iJu',
        name: 'Admin User',
        role: 'OWNER',
        companyId: company.id,
      },
    });

    console.log('✓ Admin user created successfully!');
    console.log('  Login Credentials:');
    console.log('  Username: admin');
    console.log('  Password: test123');
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('✓ User already exists!');
      console.log('  Login Credentials:');
      console.log('  Username: admin');
      console.log('  Password: test123');
    } else {
      console.error('Error:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
