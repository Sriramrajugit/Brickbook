// app/api/transactions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/transactions
export async function GET(_req: NextRequest) {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { date: 'desc' },
      include: { account: true }, // assumes Account model exists
    });

    return NextResponse.json(transactions);
  } catch (err) {
    console.error('Error fetching transactions:', err);
    console.error('TX API error:', err);

    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 },
    );
  }
}

// POST /api/transactions
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('TX body:', body);

    const amount = Number(body.amount);
    const accountId = Number(body.accountId);
    const type = (body.type as string) || 'Expense';

    if (!amount || isNaN(amount)) {
      return NextResponse.json(
        { error: 'Amount is required and must be a number' },
        { status: 400 },
      );
    }

    if (!body.date) {
      return NextResponse.json(
        { error: 'Date is required' },
        { status: 400 },
      );
    }

    // Validate: Future dates are not allowed
    const transactionDate = new Date(body.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    transactionDate.setHours(0, 0, 0, 0);
    
    if (transactionDate > today) {
      return NextResponse.json(
        { error: 'Future date transactions are not allowed' },
        { status: 400 },
      );
    }

    const tx = await prisma.transaction.create({
      data: {
        amount,
        description: body.description || null,
        category: body.category || 'Other',
        type, // 'Income' | 'Expense'
        date: new Date(body.date), // from <input type="date">
        accountId,
      },
      include: { account: true },
    });

    return NextResponse.json(tx, { status: 201 });
  } catch (err) {
    console.error('Error creating transaction:', err);
    console.error('TX API error:', err);

    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 },
    );
  }
}
