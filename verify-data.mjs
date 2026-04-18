import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyData() {
  try {
    console.log('📊 Checking database contents...\n');

    const companies = await prisma.company.findMany();
    console.log('Companies:', companies.length);
    companies.forEach(c => console.log(`  - ${c.name} (id: ${c.id})`));

    const users = await prisma.user.findMany();
    console.log('\nUsers:', users.length);
    users.forEach(u => console.log(`  - ${u.email} (${u.name})`));

    const categories = await prisma.category.findMany();
    console.log('\nCategories:', categories.length);
    categories.forEach(c => console.log(`  - ${c.name}`));

    const accounts = await prisma.account.findMany();
    console.log('\nAccounts:', accounts.length);
    accounts.forEach(a => console.log(`  - ${a.name}`));

    const suppliers = await prisma.supplier.findMany();
    console.log('\nSuppliers:', suppliers.length);
    suppliers.forEach(s => console.log(`  - ${s.name}`));

    const items = await prisma.item.findMany();
    console.log('\nInventory Items:', items.length);
    items.forEach(i => console.log(`  - ${i.name}`));

    const employees = await prisma.employee.findMany();
    console.log('\nEmployees:', employees.length);
    employees.forEach(e => console.log(`  - ${e.name}`));

    console.log('\n✅ Verification complete');

  } catch (err) {
    console.error('❌ Error verifying data:', err);
  } finally {
    await prisma.$disconnect();
  }
}

verifyData();
