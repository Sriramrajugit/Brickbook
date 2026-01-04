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
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 },
    );
  }
}

// POST /api/transactions
export async function POST(req: NextRequest) {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user || !user.companyId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const companyId = user.companyId as number;

    // Check if user has permission to create transactions
    if (user.role === 'GUEST') {
      return NextResponse.json(
        { error: 'Permission denied. Guests cannot create transactions.' },
        { status: 403 },
      );
    }

    const body = await req.json();

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

    // Validate: Only truly future dates are not allowed (today is OK)
    const transactionDate = new Date(body.date);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    transactionDate.setHours(0, 0, 0, 0);
    
    if (transactionDate >= tomorrow) {
      return NextResponse.json(
        { error: 'Future date transactions are not allowed' },
        { status: 400 },
      );
    }


    // Map siteId from user (adjust if your schema uses a different field)
    const categoryId = body.categoryId ? Number(body.categoryId) : null;
    
    const tx = await prisma.transaction.create({
      data: {
        amount,
        description: body.description || undefined,
        category: body.category || 'Other',
        categoryId: categoryId || null,
        type, // 'Income' | 'Expense'
        paymentMode: body.paymentMode || 'G-Pay',
        date: new Date(body.date), // from <input type="date">
        accountId,
        createdBy: user.id,
        companyId: companyId,
        siteId: user.siteId ?? undefined,
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
        description: body.description || undefined,
        category: body.category || 'Other',
        categoryId: body.categoryId ? Number(body.categoryId) : null,
        type: body.type || 'Cash-Out',
        paymentMode: body.paymentMode || 'G-Pay',
        date: new Date(body.date),
        accountId,
        siteId: user.siteId ?? undefined,
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
    return NextResponse.json(
      { error: 'Failed to delete transaction' },
      { status: 500 }
    );
  }
}
