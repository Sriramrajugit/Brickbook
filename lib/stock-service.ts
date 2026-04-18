import { prisma } from '@/lib/prisma'

export async function updateStockOnGRN(
  grnItems: Array<{
    itemId: number
    quantityAccepted: number
    description?: string
  }>
) {
  for (const item of grnItems) {
    const result = await prisma.item.update({
      where: { id: item.itemId },
      data: {
        currentStock: {
          increment: item.quantityAccepted
        }
      }
    })
    
    console.log(`📦 Stock updated: ${item.description || `Item ${item.itemId}`} +${item.quantityAccepted} (New total: ${result.currentStock})`)
  }
}

export async function getGRNSummaryForPO(poId: number) {
  const grns = await prisma.goodsReceivedNote.findMany({
    where: { poId },
    include: { items: true }
  })

  const summary = {
    totalGRNs: grns.length,
    totalReceived: 0,
    totalRejected: 0,
    totalAccepted: 0,
    lastGRNDate: null as Date | null,
    grnNumbers: [] as string[]
  }

  for (const grn of grns) {
    summary.grnNumbers.push(grn.grnNumber)
    if (!summary.lastGRNDate || grn.createdAt > summary.lastGRNDate) {
      summary.lastGRNDate = grn.createdAt
    }

    for (const item of grn.items) {
      summary.totalReceived += item.quantityReceived
      summary.totalRejected += item.quantityRejected
      summary.totalAccepted += item.quantityAccepted
    }
  }

  return summary
}

export async function getItemsWithReceipt(poId: number) {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: poId },
    include: {
      items: {
        include: {
          grnItems: true
        }
      }
    }
  })

  if (!po) return []

  return po.items.map((poItem: any) => {
    const received = poItem.grnItems.reduce((sum: any, grn: any) => sum + grn.quantityReceived, 0)
    const rejected = poItem.grnItems.reduce((sum: any, grn: any) => sum + grn.quantityRejected, 0)
    const accepted = received - rejected
    
    return {
      id: poItem.id,
      itemCode: poItem.itemCode,
      description: poItem.description,
      quantityOrdered: poItem.quantity,
      quantityReceived: received,
      quantityRejected: rejected,
      quantityAccepted: accepted,
      quantityPending: Math.max(0, poItem.quantity - received),
      percentReceived: Math.round((received / poItem.quantity) * 100),
      status: received === 0 ? 'Pending' : received < poItem.quantity ? 'Partial' : 'Complete',
      grnItems: poItem.grnItems
    }
  })
}
