import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createTestPO() {
  try {
    console.log('Creating test PO...')
    
    // Get the first supplier
    const supplier = await prisma.supplier.findFirst({
      where: { companyId: 1 }
    })

    if (!supplier) {
      console.log('❌ No suppliers found! Create a supplier first.')
      return
    }

    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber: 'PO-001',
        date: new Date(),
        status: 'Draft',
        supplierId: supplier.id,
        vendorName: supplier.name,
        vendorContact: supplier.email || 'contact@supplier.com',
        vendorAddress: supplier.address || '123 Supplier St',
        vendorPhone: supplier.phone || '555-1234',
        shipToName: 'Warehouse',
        shipToAddress: '456 Warehouse Rd',
        shipToCity: 'City',
        shipToState: 'State',
        shipToZip: '12345',
        requisitioner: 'Test User',
        shipVia: 'Ground',
        fob: 'FOB Shipping Point',
        shippingTerms: 'Net 30',
        comments: 'Test purchase order',
        subtotal: 0,
        taxAmount: 0,
        shippingAmount: 0,
        otherAmount: 0,
        totalAmount: 0,
        companyId: 1
      },
      include: {
        supplier: true,
        items: true
      }
    })

    console.log('✅ Test PO created successfully!')
    console.log('PO ID:', po.id)
    console.log('PO Number:', po.poNumber)

    // Now create a test item
    const item = await prisma.purchaseOrderItem.create({
      data: {
        purchaseOrderId: po.id,
        description: 'Test Item - Steel Rods',
        quantity: 10,
        unitOfMeasure: 'Kg',
        specification: '12mm diameter, Grade A',
        unitPrice: 500,
        totalPrice: 5000,
        remarks: 'Premium quality'
      }
    })

    // Update PO totals
    const updatedPO = await prisma.purchaseOrder.update({
      where: { id: po.id },
      data: {
        subtotal: 5000,
        totalAmount: 5000,
        items: {
          connect: { id: item.id }
        }
      }
    })

    console.log('✅ Test item added successfully!')
    console.log('Ready to view at: http://localhost:3000/inventory/purchase-orders/' + po.id)

  } catch (error) {
    console.error('❌ Error creating test PO:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestPO()
