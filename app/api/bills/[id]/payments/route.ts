import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify bill exists
    const bill = await prisma.partnerBill.findUnique({
      where: { id: parseInt(id) },
    });

    if (!bill || bill.companyId !== user.companyId) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    const payments = await prisma.partnerBillPayment.findMany({
      where: { billId: parseInt(id) },
      orderBy: { paymentDate: 'desc' },
    });

    return NextResponse.json({ data: payments });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user || !user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      paymentDate,
      amount,
      paymentMode = 'GPAY',
      referenceNo,
      accountId, // Optional - will default to bill's account if not provided
    } = body;

    if (!paymentDate || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: paymentDate, amount' },
        { status: 400 }
      );
    }

    // Verify bill exists and belongs to company
    const bill = await prisma.partnerBill.findUnique({
      where: { id: parseInt(id) },
      include: { employee: true, account: true },
    });

    if (!bill || bill.companyId !== user.companyId) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    // Use provided accountId or default to bill's account
    const effectiveAccountId = accountId ? parseInt(accountId) : bill.accountId;

    // Verify account exists and belongs to company (even if using default)
    const account = await prisma.account.findUnique({
      where: { id: effectiveAccountId },
    });

    if (!account || account.companyId !== user.companyId) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const paymentAmount = parseFloat(amount);
    const newPaidAmount = bill.paidAmount + paymentAmount;

    // Determine new bill status
    let newStatus: string = 'UNPAID';
    if (newPaidAmount >= bill.amount) {
      newStatus = 'FULLY_PAID';
    } else if (newPaidAmount > 0) {
      newStatus = 'PARTIALLY_PAID';
    }

    // Extract user values for transaction (TypeScript type narrowing)
    const userId = user.id;
    const companyId = user.companyId;
    const siteId = user.siteId || null;

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx: any) => {
      // Create payment record
      const payment = await tx.partnerBillPayment.create({
        data: {
          companyId: companyId,
          billId: parseInt(id),
          paymentDate: new Date(paymentDate),
          amount: paymentAmount,
          paymentMode,
          referenceNo,
        },
      });

      // Create transaction entry automatically
      const transaction = await tx.transaction.create({
        data: {
          amount: paymentAmount,
          description: `Payment for ${bill.employee.name} - Invoice ${bill.invoiceNo}`,
          category: 'To Supplier',
          type: 'Cash-Out',
          date: new Date(paymentDate),
          accountId: effectiveAccountId,
          paymentMode,
          categoryId: null, // Will be set to Supplier Payment category if it exists
          createdBy: userId,
          companyId: companyId,
          siteId: siteId,
        },
      });

      // Update payment with transaction ID
      const updatedPayment = await tx.partnerBillPayment.update({
        where: { id: payment.id },
        data: { transactionId: transaction.id },
      });

      // Update bill status and paid amount
      const updatedBill = await tx.partnerBill.update({
        where: { id: parseInt(id) },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus,
        },
        include: {
          employee: true,
          payments: true,
        },
      });

      return { payment: updatedPayment, transaction, bill: updatedBill };
    });

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    console.error('Error recording payment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to record payment';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
