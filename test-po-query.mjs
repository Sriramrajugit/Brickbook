import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testQuery() {
  try {
    console.log('🔍 Testing PO query with companyId filter...');
    
    // Query all POs first
    const allPos = await prisma.purchaseOrder.findMany();
    console.log(`✅ Found ${allPos.length} total POs`);
    
    // Get first PO details
    const firstPo = allPos[0];
    if (firstPo) {
      console.log(`\n📋 First PO details:`);
      console.log(`  - ID: ${firstPo.id}`);
      console.log(`  - companyId: ${firstPo.companyId}`);
      console.log(`  - poNumber: ${firstPo.poNumber}`);
      console.log(`  - supplierId: ${firstPo.supplierId}`);
    }
    
    // Now try with includes (same as API)
    console.log('\n🔗 Trying query with supplier and items includes...');
    const po = await prisma.purchaseOrder.findFirst({
      where: {
        id: 1,
        companyId: 1
      },
      include: {
        supplier: {
          select: { name: true }
        },
        items: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });
    
    if (po) {
      console.log('✅ Query succeeded!');
      console.log('Response:', JSON.stringify(po, null, 2).substring(0, 300));
    } else {
      console.log('❌ Query returned null - PO not found with that companyId');
    }
    
  } catch (error) {
    console.error('❌ Query failed with error:');
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    if (error.stack) {
      console.error('Stack:', error.stack.substring(0, 300));
    }
  } finally {
    await prisma.$disconnect();
  }
}

testQuery();
