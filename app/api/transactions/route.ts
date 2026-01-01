// app/api/transactions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/transactions
export async function GET(req: NextRequest) {
  try {
    // Get current user for multi-tenancy
    const user = await getCurrentUser();
    if (!user || !user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const category = searchParams.get('category');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');

    // Build where clause for filtering and multi-tenancy
    const where: any = {
      companyId: user.companyId,
    };
    if (user.siteId) {
      where.siteId = user.siteId;
    }
    if (category && category !== 'All') {
      where.category = category;
    }
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        where.date.lte = endDateTime;
      }
    }
    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count for pagination
    const total = await prisma.transaction.count({ where });

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Fetch paginated data
    const transactions = await prisma.transaction.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
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
      },
    });

    return NextResponse.json({
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('Error fetching transactions:', err);
    if (err instanceof Error) {
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
    }
    try {
      // Log the user context if possible
      const user = await getCurrentUser();
      console.error('Current user in error:', user);
    } catch (e) {
      console.error('Error getting user in error handler:', e);
    }
    return NextResponse.json(
      { error: 'Failed to fetch transactions', details: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

// POST /api/transactions
export async function POST(req: NextRequest) {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }

    // Check if user has permission to create transactions
    if (user.role === 'GUEST') {
      return NextResponse.json(
        { error: 'Permission denied. Guests cannot create transactions.' },
        { status: 403 },
      );
    }

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


    // Map siteId from user (adjust if your schema uses a different field)
    const tx = await prisma.transaction.create({
      data: {
        amount,
        description: body.description || null,
        category: body.category || 'Other',
        type, // 'Income' | 'Expense'
        paymentMode: body.paymentMode || 'G-Pay',
        date: new Date(body.date), // from <input type="date">
        accountId,
        createdBy: user.id,
        companyId: user.companyId,
        siteId: user.siteId,
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
      },
    });

    return NextResponse.json(tx, { status: 201 });
  } catch (err) {
    console.error('Error creating transaction:', err);
    if (err instanceof Error) {
      console.error('Error stack:', err.stack);
    }
    console.error('TX API error:', err);

    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 },
    );
  }
}

// PUT /api/transactions (Owner only)
export async function PUT(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
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
      where: { id: parseInt(id) },
      data: {
        amount,
        description: body.description || null,
        category: body.category || 'Other',
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

// DELETE /api/transactions (Owner only)
export async function DELETE(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    await prisma.transaction.delete({
      where: { id: parseInt(id) }
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
