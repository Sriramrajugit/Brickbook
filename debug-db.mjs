import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugDatabase() {
  try {
    console.log('🔍 Database Connection Details:');
    console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50) + '...');

    // Count all records
    const stats = {
      companies: await prisma.company.count(),
      users: await prisma.user.count(),
      accounts: await prisma.account.count(),
      categories: await prisma.category.count(),
      suppliers: await prisma.supplier.count(),
      items: await prisma.item.count(),
      employees: await prisma.employee.count(),
      purchaseOrders: await prisma.purchaseOrder.count(),
      grns: await prisma.goodsReceivedNote.count(),
    };

    console.log('\n📊 Total Records in Database:');
    Object.entries(stats).forEach(([key, count]) => {
      console.log(`  ${key}: ${count}`);
    });

    // Get user details
    const users = await prisma.user.findMany({
      select: { id: true, email: true, companyId: true, name: true }
    });

    console.log('\n👤 Users with Company Assignment:');
    users.forEach(u => {
      console.log(`  ID: ${u.id}, Email: ${u.email}, Company: ${u.companyId}, Name: ${u.name}`);
    });

    // Get first user and their company
    if (users.length > 0) {
      const user = users[0];
      const company = await prisma.company.findUnique({
        where: { id: user.companyId },
        select: { id: true, name: true }
      });
      console.log(`\n🏢 First User's Company: ${company?.name} (ID: ${company?.id})`);

      // Get accounts for this company
      const accounts = await prisma.account.findMany({
        where: { companyId: user.companyId },
        select: { id: true, name: true, companyId: true }
      });
      console.log(`\n📋 Accounts for ${company?.name}:`);
      accounts.forEach(a => console.log(`  - ${a.name} (ID: ${a.id}, companyId: ${a.companyId})`));
    }

    console.log('\n✅ Debug complete');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugDatabase();
