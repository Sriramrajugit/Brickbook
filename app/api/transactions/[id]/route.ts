// app/api/transactions/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// PUT /api/transactions/[id] - Update transaction (Owner only)
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only Owner can edit transactions
    if (user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Permission denied. Only Owner can edit transactions.' },
        { status: 403 }
      );
    }

    const params = await context.params;

    // Check if this transaction is linked to a bill payment
    const linkedBillPayment = await prisma.partnerBillPayment.findFirst({
      where: { transactionId: parseInt(params.id) }
    });

    if (linkedBillPayment) {
      return NextResponse.json(
        { error: 'Cannot edit bill payment transactions. Delete the payment from the Bills section to make changes.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const amount = Number(body.amount);
    const accountId = Number(body.accountId);

    if (!amount || isNaN(amount)) {
      return NextResponse.json(
        { error: 'Amount is required and must be a number' },
        { status: 400 }
      );
    }

    const transaction = await prisma.transaction.update({
      where: { id: parseInt(params.id) },
      data: {
        amount,
        description: body.description || null,
        category: body.category || 'Other',
        categoryId: body.categoryId ? Number(body.categoryId) : null,
        type: body.type || 'Cash-Out',
        paymentMode: body.paymentMode || 'G-Pay',
        date: new Date(body.date),
        accountId,
      },
      include: {
        account: true,
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    return NextResponse.json(transaction);
  } catch (err) {
    console.error('Error updating transaction:', err);
    return NextResponse.json(
      { error: 'Failed to update transaction' },
      { status: 500 }
    );
  }
}

// DELETE /api/transactions/[id] - Delete transaction (Owner only)
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only Owner can delete transactions
    if (user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Permission denied. Only Owner can delete transactions.' },
        { status: 403 }
      );
    }

    const params = await context.params;

    // Check if this transaction is linked to a bill payment
    const linkedBillPayment = await prisma.partnerBillPayment.findFirst({
      where: { transactionId: parseInt(params.id) }
    });

    if (linkedBillPayment) {
      return NextResponse.json(
        { error: 'Cannot delete bill payment transactions. Delete the payment from the Bills section instead.' },
        { status: 403 }
      );
    }

    await prisma.transaction.delete({
      where: { id: parseInt(params.id) }
    });

    return NextResponse.json({ message: 'Transaction deleted successfully' });
  } catch (err) {
    console.error('Error deleting transaction:', err);
    return NextResponse.json(
      { error: 'Failed to delete transaction' },
      { status: 500 }
    );
  }
}
