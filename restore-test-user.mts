import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    // Check if company exists
    let company = await prisma.company.findFirst({
      where: { name: 'Default Company' },
    });

    if (!company) {
      console.log('Creating default company...');
      company = await prisma.company.create({
        data: {
          name: 'Default Company',
        },
      });
    }

    console.log('Company:', company);

    // Check if user exists
    let user = await prisma.user.findFirst({
      where: { email: 'admin@example.com' },
    });

    if (user) {
      console.log('User already exists:', user);
      console.log('\n✅ Login Credentials:');
      console.log('Email: admin@example.com');
      console.log('Password: admin');
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin', 10);
    user = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        name: 'Admin User',
        password: hashedPassword,
        role: 'OWNER',
        status: 'Active',
        companyId: company.id,
      },
    });

    console.log('✅ Admin user created successfully!');
    console.log('\n✅ Login Credentials:');
    console.log('Email: admin@example.com');
    console.log('Password: admin');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
