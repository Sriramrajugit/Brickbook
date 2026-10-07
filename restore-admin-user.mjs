import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔄 Restoring default admin user...');

    // First, ensure we have a company
    let company = await prisma.company.findFirst();
    
    if (!company) {
      console.log('📋 Creating default company...');
      company = await prisma.company.create({
        data: {
          name: 'BrickBook Admin',
        },
      });
      console.log('✅ Company created:', company.id);
    } else {
      console.log('✅ Using existing company:', company.id);
    }

    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { email: 'admin@brickbook.in' },
    });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      return;
    }

    // Hash the password
    const hashedPassword = await bcryptjs.hash('admin', 10);

    // Create admin user
    const user = await prisma.user.create({
      data: {
        email: 'admin@brickbook.in',
        name: 'BrickBook Admin',
        password: hashedPassword,
        role: 'OWNER',
        status: 'Active',
        companyId: company.id,
      },
    });

    console.log('✅ Admin user restored successfully!');
    console.log('📧 Email: admin@brickbook.in');
    console.log('🔑 Password: admin');
    console.log('👤 Role: OWNER');
    console.log('🏢 Company ID:', company.id);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
