import pkg from 'jsonwebtoken';
const { sign } = pkg;
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAPIFlow() {
  try {
    // Step 1: Get a valid user
    console.log('📍 Step 1: Getting a valid user...');
    const user = await prisma.user.findFirst({
      where: { companyId: 1 },
      select: { id: true, email: true, companyId: true, name: true, role: true }
    });
    
    if (!user) {
      console.error('❌ No user found for companyId 1');
      process.exit(1);
    }
    console.log(`✅ Found user: ${user.name || user.email} (ID: ${user.id})`);
    
    // Step 2: Create a JWT token like the API would receive
    console.log('\n📍 Step 2: Creating JWT token...');
    const token = sign({ userId: user.id }, process.env.JWT_SECRET || 'test-secret');
    console.log(`✅ Token created: ${token.substring(0, 50)}...`);
    
    // Step 3: Simulate what the API endpoint does
    console.log('\n📍 Step 3: Running API endpoint logic...');
    const poId = 1;
    
    const po = await prisma.purchaseOrder.findFirst({
      where: {
        id: poId,
        companyId: user.companyId
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
    
    if (!po) {
      console.log('❌ Purchase Order not found');
      process.exit(1);
    }
    
    console.log('✅ PO fetched successfully!');
    
    // Step 4: Format response like the API does
    console.log('\n📍 Step 4: Formatting response...');
    const response = {
      data: {
        id: po.id,
        poNumber: po.poNumber,
        date: po.date,
        status: po.status,
        supplierId: po.supplierId,
        supplier: po.supplier,
        vendorName: po.vendorName,
        vendorContact: po.vendorContact,
        vendorAddress: po.vendorAddress,
        vendorPhone: po.vendorPhone,
        shipToName: po.shipToName,
        shipToAddress: po.shipToAddress,
        shipToCity: po.shipToCity,
        shipToState: po.shipToState,
        shipToZip: po.shipToZip,
        requisitioner: po.requisitioner,
        shipVia: po.shipVia,
        fob: po.fob,
        shippingTerms: po.shippingTerms,
        comments: po.comments,
        items: po.items,
        subtotal: po.subtotal,
        taxAmount: po.taxAmount,
        shippingAmount: po.shippingAmount,
        otherAmount: po.otherAmount,
        totalAmount: po.totalAmount
      }
    };
    
    console.log('✅ Response formatted successfully');
    console.log('\n📊 Final Response:');
    console.log(JSON.stringify(response, null, 2).substring(0, 500) + '...');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack?.substring(0, 500));
  } finally {
    await prisma.$disconnect();
  }
}

testAPIFlow();
