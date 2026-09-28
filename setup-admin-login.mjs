import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function setupAdmin() {
  try {
    console.log('🔧 Setting up admin user...\n');

    // First, check if there's a company (required for user)
    let company = await prisma.company.findFirst();
    
    if (!company) {
      console.log('📝 No company found. Creating default company...');
      company = await prisma.company.create({
        data: { name: 'Default Company' }
      });
      console.log(`✅ Company created: ${company.name} (ID: ${company.id})\n`);
    } else {
      console.log(`✅ Using existing company: ${company.name} (ID: ${company.id})\n`);
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('admin', 10);

    // Create or update admin user
    const user = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: { password: hashedPassword },
      create: {
        email: 'admin@example.com',
        name: 'Admin User',
        password: hashedPassword,
        companyId: company.id,
        role: 'OWNER',
      },
    });

    console.log('✅ Admin user ready!\n');
    console.log('📋 Login Credentials:');
    console.log(`   Email: ${user.email}`);
    console.log(`   User ID: ${user.id}`);
    console.log(`   Password: admin`);
    console.log(`   Role: ${user.role}\n`);
    
    console.log('🔐 You can login with either:');
    console.log(`   1. Email: ${user.email}`);
    console.log(`   2. User ID: ${user.id}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

setupAdmin();
