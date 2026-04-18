import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupTestData() {
  try {
    console.log('🔧 Setting up test data...\n');

    // 1. Create a Company
    const company = await prisma.company.upsert({
      where: { name: 'Studio Ullixa' },
      update: {},
      create: { name: 'Studio Ullixa' }
    });
    console.log('✅ Company created:', company.name);

    // 2. Create Test Users
    const user1 = await prisma.user.upsert({
      where: { email: 'testuser' },
      update: {},
      create: {
        email: 'testuser',
        password: '$2b$10$N9qo8uLOickgx2ZMRZoMyeiPS.nWBjmEKHqLUHqBPHJHGXGAH3iJu', // test123
        name: 'Test User',
        role: 'OWNER',
        status: 'ACTIVE',
        companyId: company.id
      }
    });
    console.log('✅ Test User created:', user1.email);

    const user2 = await prisma.user.upsert({
      where: { email: 'admin@studio.com' },
      update: {},
      create: {
        email: 'admin@studio.com',
        password: '$2b$10$N9qo8uLOickgx2ZMRZoMyeiPS.nWBjmEKHqLUHqBPHJHGXGAH3iJu', // test123
        name: 'Admin User',
        role: 'OWNER',
        status: 'ACTIVE',
        companyId: company.id
      }
    });
    console.log('✅ Admin User created:', user2.email);

    // 3. Create Categories
    const categories = await Promise.all([
      prisma.category.upsert({
        where: { name_companyId: { name: 'Salary', companyId: company.id } },
        update: {},
        create: { name: 'Salary', description: 'Salary payments', companyId: company.id }
      }),
      prisma.category.upsert({
        where: { name_companyId: { name: 'Rent', companyId: company.id } },
        update: {},
        create: { name: 'Rent', description: 'Rent and property costs', companyId: company.id }
      }),
      prisma.category.upsert({
        where: { name_companyId: { name: 'Materials', companyId: company.id } },
        update: {},
        create: { name: 'Materials', description: 'Building materials', companyId: company.id }
      }),
      prisma.category.upsert({
        where: { name_companyId: { name: 'Income', companyId: company.id } },
        update: {},
        create: { name: 'Income', description: 'Income sources', companyId: company.id }
      })
    ]);
    console.log('✅ Categories created:', categories.length);

    // 4. Create Accounts
    try {
      const account1 = await prisma.account.create({
        data: {
          name: 'Main Project',
          type: 'Project',
          budget: 500000,
          address: '123 Main Street, City, State',
          companyId: company.id
        }
      });
      console.log('✅ Accounts created');
    } catch (err) {
      console.log('⚠️  Accounts already exist or error occurred');
    }

    // 5. Create Suppliers
    try {
      const supplier1 = await prisma.supplier.create({
        data: {
          name: 'ABC Materials',
          email: 'abc@materials.com',
          phone: '9876543210',
          address: '789 Industrial Park, City',
          companyId: company.id
        }
      });
      console.log('✅ Suppliers created');
    } catch (err) {
      console.log('⚠️  Suppliers already exist or error occurred');
    }

    // 6. Create Employees
    try {
      const employee1 = await prisma.employee.create({
        data: {
          name: 'John Doe',
          email: 'john@studio.com',
          phone: '9111111111',
          position: 'Manager',
          companyId: company.id
        }
      });
      console.log('✅ Employees created');
    } catch (err) {
      console.log('⚠️  Employees already exist or error occurred');
    }

    // 7. Create Inventory Items
    try {
      const item1 = await prisma.item.create({
        data: {
          name: 'Cement Bags',
          description: 'Portland Cement 50kg bags',
          category: 'Materials',
          quantity: 100,
          unitPrice: 350.00,
          companyId: company.id
        }
      });
      console.log('✅ Inventory Items created');
    } catch (err) {
      console.log('⚠️  Inventory items already exist or error occurred');
    }

    console.log('\n🎉 Test data setup completed successfully!\n');
    console.log('📝 Test User Credentials:');
    console.log('   Email: testuser');
    console.log('   Password: test123\n');
    console.log('   OR\n');
    console.log('   Email: admin@studio.com');
    console.log('   Password: test123');

  } catch (err) {
    console.error('❌ Error setting up test data:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupTestData();
