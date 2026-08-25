import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const inThreeDays = new Date(today);
    inThreeDays.setDate(inThreeDays.getDate() + 3);

    const inSevenDays = new Date(today);
    inSevenDays.setDate(inSevenDays.getDate() + 7);

    // Get unpaid/partially paid bills by status
    const billsByStatus = await prisma.partnerBill.groupBy({
      by: ['status'],
      where: {
        companyId: user.companyId,
      },
      _count: true,
    });

    // Get overdue bills (due date < today and not fully paid)
    const overdueBills = await prisma.partnerBill.findMany({
      where: {
        companyId: user.companyId,
        dueDate: { lt: today },
        status: { in: ['UNPAID', 'PARTIALLY_PAID'] },
      },
      include: { partner: true },
    });

    // Get bills due in next 3 days
    const dueInThreeDays = await prisma.partnerBill.findMany({
      where: {
        companyId: user.companyId,
        dueDate: {
          gte: today,
          lte: inThreeDays,
        },
        status: { in: ['UNPAID', 'PARTIALLY_PAID'] },
      },
      include: { partner: true },
    });

    // Get bills due in next 3-7 days
    const dueInWeek = await prisma.partnerBill.findMany({
      where: {
        companyId: user.companyId,
        dueDate: {
          gt: inThreeDays,
          lte: inSevenDays,
        },
        status: { in: ['UNPAID', 'PARTIALLY_PAID'] },
      },
      include: { partner: true },
    });

    // Get payments completed in current month
    const firstDayOfMonth = new Date(today);
    firstDayOfMonth.setDate(1);

    const paymentsThisMonth = await prisma.partnerBillPayment.count({
      where: {
        companyId: user.companyId,
        paymentDate: {
          gte: firstDayOfMonth,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000), // Up to end of today
        },
      },
    });

    const alerts = {
      overdue: {
        count: overdueBills.length,
        bills: overdueBills,
        severity: overdueBills.length > 0 ? 'high' : 'low',
      },
      dueInThreeDays: {
        count: dueInThreeDays.length,
        bills: dueInThreeDays,
        severity: dueInThreeDays.length > 0 ? 'medium' : 'low',
      },
      dueInWeek: {
        count: dueInWeek.length,
        bills: dueInWeek,
        severity: dueInWeek.length > 0 ? 'low' : 'low',
      },
      paymentsThisMonth: paymentsThisMonth,
    };

    const billStats = {
      unpaid: billsByStatus.find((b: any) => b.status === 'UNPAID')?._count || 0,
      partiallyPaid:
        billsByStatus.find((b: any) => b.status === 'PARTIALLY_PAID')?._count || 0,
      fullyPaid:
        billsByStatus.find((b: any) => b.status === 'FULLY_PAID')?._count || 0,
    };

    return NextResponse.json({
      data: {
        alerts,
        billStats,
      },
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}
