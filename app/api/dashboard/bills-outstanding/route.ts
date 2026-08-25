import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get outstanding from suppliers (bills not fully paid)
    const supplierOutstanding = await prisma.partnerBill.aggregate({
      where: {
        companyId: user.companyId,
        partner: {
          partnerType: 'SUPPLIER',
        },
        status: { in: ['UNPAID', 'PARTIALLY_PAID'] },
      },
      _sum: {
        amount: true,
      },
    });

    // Calculate supplier outstanding (amount - paidAmount)
    const supplierBills = await prisma.partnerBill.findMany({
      where: {
        companyId: user.companyId,
        partner: {
          partnerType: 'SUPPLIER',
        },
        status: { in: ['UNPAID', 'PARTIALLY_PAID'] },
      },
    });

    let supplierPayableAmount = 0;
    supplierBills.forEach((bill: any) => {
      supplierPayableAmount += bill.amount - bill.paidAmount;
    });

    // Get outstanding from customers (bills not fully paid) - for future receivables tracking
    const customerBills = await prisma.partnerBill.findMany({
      where: {
        companyId: user.companyId,
        partner: {
          partnerType: 'CUSTOMER',
        },
        status: { in: ['UNPAID', 'PARTIALLY_PAID'] },
      },
    });

    let customerReceivableAmount = 0;
    customerBills.forEach((bill: any) => {
      customerReceivableAmount += bill.amount - bill.paidAmount;
    });

    // Get breakdown by partner
    const supplierBreakdown = await prisma.partnerBill.groupBy({
      by: ['partnerId'],
      where: {
        companyId: user.companyId,
        partner: {
          partnerType: 'SUPPLIER',
        },
        status: { in: ['UNPAID', 'PARTIALLY_PAID'] },
      },
      _sum: {
        amount: true,
      },
    });

    const supplierDetailsPromise = Promise.all(
      supplierBreakdown.map(async (item: any) => {
        const partner = await prisma.partner.findUnique({
          where: { id: item.partnerId },
        });
        const bills = await prisma.partnerBill.findMany({
          where: {
            partnerId: item.partnerId,
            status: { in: ['UNPAID', 'PARTIALLY_PAID'] },
          },
        });
        let balance = 0;
        bills.forEach((bill: any) => {
          balance += bill.amount - bill.paidAmount;
        });
        return {
          partner: partner?.name,
          partnerId: item.partnerId,
          totalBilled: item._sum.amount,
          balance,
        };
      })
    );

    const supplierDetails = await supplierDetailsPromise;

    return NextResponse.json({
      data: {
        summary: {
          supplierPayable: supplierPayableAmount,
          customerReceivable: customerReceivableAmount,
          netPosition: customerReceivableAmount - supplierPayableAmount,
        },
        supplierBreakdown: supplierDetails,
        customerBreakdown: customerBills.length,
      },
    });
  } catch (error) {
    console.error('Error fetching outstanding:', error);
    return NextResponse.json(
      { error: 'Failed to fetch outstanding amounts' },
      { status: 500 }
    );
  }
}
