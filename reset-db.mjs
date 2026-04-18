import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function setupData() {
  try {
    // Create or get company
    const company = await prisma.company.upsert({
      where: { name: 'Default Company' },
      update: {},
      create: {
        name: 'Default Company'
      }
    });
    console.log('✅ Company created/found:', company.id);

    // Create or get site
    const site = await prisma.site.upsert({
      where: { name: 'Default Site' },
      update: {},
      create: {
        name: 'Default Site',
        companyId: company.id
      }
    });
    console.log('✅ Site created/found:', site.id);

    // Hash password "admin"
    const hashedPassword = '$2b$10$Ehe83JxjbB3mn8OD7l/uV.YSvvcOYd0vN0yEBgwGaU6FBoo2Cus9C';
    
    // Create admin user
    const user = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: { password: hashedPassword },
      create: {
        email: 'admin@example.com',
        password: hashedPassword,
        name: 'Admin User',
        role: 'OWNER',
        companyId: company.id,
        siteId: site.id
      }
    });
    console.log('✅ Admin user created/updated:', user.id, user.email);

    // Create sample account/location
    const account = await prisma.account.create({
      data: {
        name: 'Main Office',
        address: '123 Business St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        type: 'HEAD_OFFICE',
        companyId: company.id,
        siteId: site.id
      }
    });
    console.log('✅ Sample account created:', account.id, account.name);

    // Create sample supplier
    const supplier = await prisma.supplier.create({
      data: {
        name: 'ABC Supplies Inc',
        email: 'contact@abcsupplies.com',
        phone: '+1-555-0123',
        address: '456 Industrial Ave',
        companyId: company.id
      }
    });
    console.log('✅ Sample supplier created:', supplier.id, supplier.name);

    console.log('\n✅ Database setup complete!');
    console.log('📝 Login credentials:');
    console.log('   Email: admin@example.com');
    console.log('   Password: admin');
    console.log('   User ID: 1');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

setupData();
