import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')

    const where: any = { companyId: user.companyId }
    if (status && status !== 'all') {
      where.status = status
    }

    const [orders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        include: {
          supplier: true,
          items: true
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.purchaseOrder.count({ where })
    ])

    return NextResponse.json({
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (err) {
    console.error('Error fetching purchase orders:', err)
    return NextResponse.json(
      { error: 'Failed to fetch purchase orders' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      poNumber,
      supplierId,
      vendorName,
      vendorContact,
      vendorAddress,
      vendorPhone,
      shipToName,
      shipToAddress,
      shipToCity,
      shipToState,
      shipToZip,
      requisitioner,
      shipVia,
      fob,
      shippingTerms,
      comments,
      items
    } = body

    if (!poNumber || !supplierId || !vendorName || !shipToName) {
      return NextResponse.json(
        { error: 'Missing required fields: poNumber, supplierId, vendorName, or shipToName' },
        { status: 400 }
      )
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'At least one item is required' },
        { status: 400 }
      )
    }

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0)
    const taxAmount = body.taxAmount || 0
    const shippingAmount = body.shippingAmount || 0
    const otherAmount = body.otherAmount || 0
    const totalAmount = subtotal + taxAmount + shippingAmount + otherAmount

    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        supplierId: parseInt(supplierId),
        vendorName,
        vendorContact,
        vendorAddress,
        vendorPhone,
        shipToName,
        shipToAddress,
        shipToCity,
        shipToState,
        shipToZip,
        requisitioner,
        shipVia,
        fob,
        shippingTerms,
        comments,
        subtotal,
        taxAmount,
        shippingAmount,
        otherAmount,
        totalAmount,
        status: 'DRAFT',
        companyId: user.companyId,
        items: {
          create: items.map((item: any) => ({
            itemCode: item.itemCode,
            description: item.description,
            quantity: parseFloat(item.quantity),
            unitPrice: parseFloat(item.unitPrice),
            totalPrice: parseFloat(item.quantity) * parseFloat(item.unitPrice)
          }))
        }
      },
      include: {
        supplier: true,
        items: true
      }
    })

    return NextResponse.json(purchaseOrder, { status: 201 })
  } catch (err) {
    console.error('Error creating purchase order:', err)
    const errorMsg = err instanceof Error ? err.message : 'Failed to create purchase order'
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = parseInt(searchParams.get('id') || '0')

    if (!id) {
      return NextResponse.json({ error: 'PO ID required' }, { status: 400 })
    }

    const body = await req.json()
    const { status } = body

    const purchaseOrder = await prisma.purchaseOrder.update({
      where: { id },
      data: { status },
      include: {
        supplier: true,
        items: true
      }
    })

    return NextResponse.json(purchaseOrder)
  } catch (err) {
    console.error('Error updating purchase order:', err)
    return NextResponse.json(
      { error: 'Failed to update purchase order' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = parseInt(searchParams.get('id') || '0')

    if (!id) {
      return NextResponse.json({ error: 'PO ID required' }, { status: 400 })
    }

    await prisma.purchaseOrder.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error deleting purchase order:', err)
    return NextResponse.json(
      { error: 'Failed to delete purchase order' },
      { status: 500 }
    )
  }
}
