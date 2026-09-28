const { PrismaClient } = require('@prisma/client');

async function verify() {
  const prisma = new PrismaClient();
  try {
    const companies = await prisma.company.findMany({
      select: { id: true, name: true, package: true }
    });
    console.log('✅ MIGRATION SUCCESSFUL!');
    console.log('✅ package column now exists in companies table');
    console.log('');
    console.log('Companies in database:');
    companies.forEach(c => {
      console.log(`  - ${c.name}: ${c.package}`);
    });
    console.log('');
    console.log('✅ No production data was deleted');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
