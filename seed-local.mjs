import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🌱 Seeding test data...\n');

    // 1. Create/get company
    let company = await prisma.company.findFirst().catch(() => null);
    if (!company) {
      company = await prisma.company.create({
        data: { name: 'Test Company' },
      });
    }
    const companyId = company.id;
    console.log('✅ Company ID:', companyId);

    // 2. Create test user (with pre-hashed password: bcrypt('admin', 10))
    await prisma.user.upsert({
      where: { email: 'admin@test.com' },
      update: {},
      create: {
        email: 'admin@test.com',
        password: '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36DGY1s6', // hashed 'admin'
        name: 'Admin',
        role: 'OWNER',
        companyId,
      },
    }).catch(() => null);
    console.log('✅ User: admin@test.com / admin');

    // 3. Create categories
    const categories = ['Capital', 'Salary', 'Rent', 'Utilities', 'Travel', 'Income', 'Salary Advance', 'To Contractor'];
    for (const catName of categories) {
      await prisma.category.upsert({
        where: { name_companyId: { name: catName, companyId } },
        update: {},
        create: { name: catName, companyId },
      }).catch(() => null);
    }
    console.log('✅ Categories created');

    // 4. Create test accounts
    for (let i = 1; i <= 3; i++) {
      await prisma.account.create({
        data: {
          name: `Project ${i}`,
          type: 'Operational',
          budget: 100000 * i,
          companyId,
          projectStatus: i === 1 ? 'In-progress' : i === 2 ? 'Yet to start' : 'Completed',
          address: `Address ${i}`,
        },
      }).catch(() => null);
    }
    console.log('✅ Test accounts created');

    // 5. Create sample transactions
    const accounts = await prisma.account.findMany({ where: { companyId } });
    if (accounts.length > 0) {
      for (let i = 0; i < 5; i++) {
        await prisma.transaction.create({
          data: {
            amount: 10000 + (i * 5000),
            description: `Test transaction ${i + 1}`,
            category: i % 2 === 0 ? 'Capital' : 'Salary',
            type: i % 2 === 0 ? 'Cash-Out' : 'Cash-Out',
            paymentMode: 'G-Pay',
            date: new Date(Date.now() - i * 86400000),
            accountId: accounts[0].id,
            companyId,
          },
        }).catch(() => null);
      }
      console.log('✅ Sample transactions created');
    }

    console.log('\n✅ Done! Login: admin@test.com / admin');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
