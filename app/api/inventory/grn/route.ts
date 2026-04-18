import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { updateStockOnGRN } from '@/lib/stock-service'

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const poId = searchParams.get('poId')
    const status = searchParams.get('status')

    const where: any = { companyId: user.companyId }
    if (poId) where.poId = parseInt(poId)
    if (status && status !== 'all') where.status = status

    const [grns, total] = await Promise.all([
      prisma.goodsReceivedNote.findMany({
        where,
        include: {
          purchaseOrder: {
            select: {
              poNumber: true,
              vendorName: true,
              totalAmount: true
            }
          },
          items: true
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.goodsReceivedNote.count({ where })
    ])

    return NextResponse.json({
      data: grns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (err) {
    console.error('Error fetching GRNs:', err)
    return NextResponse.json(
      { error: 'Failed to fetch GRNs' },
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
      grnNumber,
      poId,
      receivedDate,
      warehouseLocation,
      receivedBy,
      transporterName,
      trackingNumber,
      deliveryNotes,
      items,
      discrepancies
    } = body

    if (!grnNumber || !poId || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: grnNumber, poId, items' },
        { status: 400 }
      )
    }

    // Verify PO exists and belongs to company
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: parseInt(poId) },
      include: { items: true, company: true }
    })

    if (!po) {
      return NextResponse.json({ error: 'PO not found' }, { status: 404 })
    }

    if (po.companyId !== user.companyId) {
      return NextResponse.json(
        { error: 'Unauthorized - PO belongs to different company' },
        { status: 403 }
      )
    }

    // Check for duplicate GRN number
    const existing = await prisma.goodsReceivedNote.findUnique({
      where: { grnNumber }
    })
    if (existing) {
      return NextResponse.json(
        { error: 'GRN number already exists' },
        { status: 400 }
      )
    }

    // Process GRN items
    let totalReceivedAmount = 0
    const grnItemsToCreate = []
    const stockUpdates = []

    for (const item of items) {
      const received = parseFloat(item.quantityReceived)
      const rejected = parseFloat(item.quantityRejected || 0)
      const accepted = received - rejected
      const unitPrice = parseFloat(item.unitPrice)
      const receivedAmount = received * unitPrice

      totalReceivedAmount += receivedAmount

      grnItemsToCreate.push({
        poItemId: parseInt(item.poItemId),
        quantityOrdered: parseFloat(item.quantityOrdered),
        quantityReceived: received,
        quantityRejected: rejected,
        quantityAccepted: accepted,
        description: item.description,
        unitPrice,
        receivedAmount,
        batchNumber: item.batchNumber || null,
        expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
        condition: item.condition || null,
        qcNotes: item.qcNotes || null
      })

      // Queue stock updates
      if (accepted > 0) {
        stockUpdates.push({
          itemId: parseInt(item.itemId),
          quantityAccepted: accepted,
          description: item.description
        })
      }
    }

    // Create GRN with items
    const grn = await prisma.goodsReceivedNote.create({
      data: {
        grnNumber,
        poId: parseInt(poId),
        receivedDate: new Date(receivedDate),
        warehouseLocation: warehouseLocation || null,
        receivedBy: receivedBy || null,
        transporterName: transporterName || null,
        trackingNumber: trackingNumber || null,
        deliveryNotes: deliveryNotes || null,
        discrepancies: discrepancies || null,
        totalReceivedAmount,
        companyId: user.companyId,
        items: {
          create: grnItemsToCreate
        }
      },
      include: {
        purchaseOrder: true,
        items: true
      }
    })

    // Update inventory stock
    if (stockUpdates.length > 0) {
      await updateStockOnGRN(stockUpdates)
    }

    return NextResponse.json({
      success: true,
      data: grn,
      message: `GRN ${grnNumber} created successfully. Stock updated for ${stockUpdates.length} items.`
    }, { status: 201 })
  } catch (err) {
    console.error('Error creating GRN:', err)
    const errorMsg = err instanceof Error ? err.message : 'Failed to create GRN'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}

// PUT - Update GRN status
export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = parseInt(searchParams.get('id') || '0')

    if (!id) {
      return NextResponse.json({ error: 'GRN ID required' }, { status: 400 })
    }

    const body = await req.json()
    const { status, verifiedBy } = body

    // Verify GRN exists and belongs to company
    const grn = await prisma.goodsReceivedNote.findUnique({
      where: { id }
    })

    if (!grn) {
      return NextResponse.json({ error: 'GRN not found' }, { status: 404 })
    }

    if (grn.companyId !== user.companyId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Update GRN
    const updated = await prisma.goodsReceivedNote.update({
      where: { id },
      data: {
        status: status || grn.status,
        verifiedBy: verifiedBy || grn.verifiedBy
      },
      include: {
        purchaseOrder: true,
        items: true
      }
    })

    return NextResponse.json({
      success: true,
      data: updated,
      message: `GRN updated successfully`
    })
  } catch (err) {
    console.error('Error updating GRN:', err)
    const errorMsg = err instanceof Error ? error.message : 'Failed to update GRN'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}

// DELETE - Delete GRN
export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = parseInt(searchParams.get('id') || '0')

    if (!id) {
      return NextResponse.json({ error: 'GRN ID required' }, { status: 400 })
    }

    // Verify GRN exists and belongs to company
    const grn = await prisma.goodsReceivedNote.findUnique({
      where: { id },
      include: { items: true }
    })

    if (!grn) {
      return NextResponse.json({ error: 'GRN not found' }, { status: 404 })
    }

    if (grn.companyId !== user.companyId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Only allow delete for DRAFT GRNs
    if (grn.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Can only delete DRAFT GRNs' },
        { status: 400 }
      )
    }

    // Reverse stock updates (if any)
    for (const item of grn.items) {
      if (item.quantityAccepted > 0) {
        await prisma.item.update({
          where: { id: item.id },
          data: {
            currentStock: {
              decrement: item.quantityAccepted
            }
          }
        })
      }
    }

    // Delete GRN (cascade will delete items)
    await prisma.goodsReceivedNote.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: `GRN deleted and stock reversed`
    })
  } catch (err) {
    console.error('Error deleting GRN:', err)
    const errorMsg = err instanceof Error ? err.message : 'Failed to delete GRN'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
