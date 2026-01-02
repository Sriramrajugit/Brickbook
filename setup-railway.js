import { PrismaClient } from '@prisma/client';

// Use internal Railway connection
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:YBOcbuyviYZERpPVwEMNuOsVOIGMFYdo@gondola.proxy.rlwy.net:37719/railway?sslmode=disable'
    }
  }
});

async function setupRailway() {
  try {
    console.log('Setting up Railway database...');

    // Insert company
    await prisma.company.upsert({
      where: { id: 1 },
      update: { name: 'Default Company' },
      create: { id: 1, name: 'Default Company' }
    });
    console.log('✅ Company created');

    // Insert user
    await prisma.user.upsert({
      where: { id: 1 },
      update: { 
        email: 'owner@uliixa.com',
        name: 'Owner',
        password: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36CHqDLG',
        role: 'OWNER',
        companyId: 1
      },
      create: {
        id: 1,
        email: 'owner@uliixa.com',
        name: 'Owner',
        password: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36CHqDLG',
        role: 'OWNER',
        companyId: 1
      }
    });
    console.log('✅ User created');

    // Insert accounts
    const accounts = ['Main Account', 'Petty Cash'];
    for (const accName of accounts) {
      await prisma.account.upsert({
        where: { id: accounts.indexOf(accName) + 1 },
        update: {},
        create: {
          name: accName,
          type: 'General',
          budget: 0,
          companyId: 1
        }
      });
    }
    console.log('✅ Accounts created');

    // Insert categories
    const categories = [
      { name: 'Capital', description: 'Initial investment/capital' },
      { name: 'Salary', description: 'Employee salary payments' },
      { name: 'Salary Advance', description: 'Salary advance to employees' },
      { name: 'Rent', description: 'Rent and lease payments' },
      { name: 'Utilities', description: 'Electricity, water, internet' },
      { name: 'Other', description: 'Miscellaneous expenses' }
    ];
    
    for (const cat of categories) {
      await prisma.category.upsert({
        where: { 
          name_companyId: {
            name: cat.name,
            companyId: 1
          }
        },
        update: { description: cat.description },
        create: {
          name: cat.name,
          description: cat.description,
          companyId: 1
        }
      });
    }
    console.log('✅ Categories created');

    console.log('\n🎉 Railway database setup complete!');
    console.log('Login with:');
    console.log('  User ID: 1');
    console.log('  Password: admin');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupRailway();
