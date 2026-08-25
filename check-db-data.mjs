import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Check users
    const users = await prisma.user.findMany();
    console.log('✓ Users found:', users.length);
    users.forEach(u => console.log(`  - ${u.email} (ID: ${u.id})`));

    // Check company
    const companies = await prisma.company.findMany();
    console.log('✓ Companies found:', companies.length);
    companies.forEach(c => console.log(`  - ${c.name} (ID: ${c.id})`));

    // Check suppliers
    const suppliers = await prisma.supplier.findMany();
    console.log('✓ Suppliers found:', suppliers.length);
    suppliers.forEach(s => console.log(`  - ${s.name} (ID: ${s.id})`));
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
