import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  try {
    const transactionCount = await prisma.transaction.count();
    const categoryCount = await prisma.category.count();
    const accountCount = await prisma.account.count();

    console.log('📊 Database Status:');
    console.log(`  Transactions: ${transactionCount}`);
    console.log(`  Categories: ${categoryCount}`);
    console.log(`  Accounts: ${accountCount}`);

    if (transactionCount === 0) {
      console.log('\n❌ No transactions found');
      console.log('\nCategories in database:');
      const categories = await prisma.category.findMany();
      categories.forEach(c => console.log(`  - ${c.name}`));
    } else {
      console.log(`\n✅ ${transactionCount} transactions loaded!`);
      const recent = await prisma.transaction.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
      });
      console.log('\nRecent transactions:');
      recent.forEach(t => {
        console.log(`  - ${t.description}: ₹${t.amount} (${t.category})`);
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
