import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanup() {
  try {
    console.log('🧹 Cleaning up database...\n');

    // Delete duplicate accounts (keep first one)
    const accounts = await prisma.account.findMany({ orderBy: { id: 'asc' } });
    if (accounts.length > 1) {
      for (const a of accounts.slice(1)) {
        await prisma.account.delete({ where: { id: a.id } });
      }
      console.log('✅ Removed', accounts.length - 1, 'duplicate accounts');
    }

    // Delete duplicate suppliers (keep first one)
    const suppliers = await prisma.supplier.findMany({ orderBy: { id: 'asc' } });
    if (suppliers.length > 1) {
      for (const s of suppliers.slice(1)) {
        await prisma.supplier.delete({ where: { id: s.id } });
      }
      console.log('✅ Removed', suppliers.length - 1, 'duplicate suppliers');
    }

    // Add inventory items if none exist
    const itemCount = await prisma.item.count();
    if (itemCount === 0) {
      const company = await prisma.company.findFirst();
      await prisma.item.createMany({
        data: [
          {
            name: 'Cement Bags',
            description: 'Portland Cement 50kg bags',
            category: 'Materials',
            unit: 'Bag',
            openingStock: 100,
            currentStock: 100,
            defaultRate: 350.00,
            companyId: company.id
          },
          {
            name: 'Steel Rods',
            description: '12mm Steel Rods',
            category: 'Materials',
            unit: 'Piece',
            openingStock: 50,
            currentStock: 50,
            defaultRate: 1200.00,
            companyId: company.id
          }
        ]
      });
      console.log('✅ Added 2 inventory items');
    }

    // Add employees if none exist
    const empCount = await prisma.employee.count();
    if (empCount === 0) {
      const company = await prisma.company.findFirst();
      await prisma.employee.createMany({
        data: [
          {
            name: 'John Doe',
            partnerType: 'Employee',
            etype: 'Site Manager',
            salary: 30000,
            salaryFrequency: 'Monthly',
            status: 'Active',
            companyId: company.id
          },
          {
            name: 'Jane Smith',
            partnerType: 'Employee',
            etype: 'Accountant',
            salary: 25000,
            salaryFrequency: 'Monthly',
            status: 'Active',
            companyId: company.id
          }
        ]
      });
      console.log('✅ Added 2 employees');
    }

    console.log('\n🎉 Database cleanup complete!');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();
