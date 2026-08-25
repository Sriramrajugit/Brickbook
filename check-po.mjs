import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

try {
  const pos = await prisma.purchaseOrder.findMany({
    take: 5,
    include: {
      supplier: true,
      items: true
    }
  });
  console.log('✅ PO Query successful, found:', pos.length, 'records');
  console.log(JSON.stringify(pos, null, 2));
} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  await prisma.$disconnect();
}
