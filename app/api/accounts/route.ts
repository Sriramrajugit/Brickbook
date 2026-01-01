import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest) {
  try {
    const accounts = await prisma.account.findMany({
      orderBy: { name: 'asc' },
      include: {
        transactions: {
          select: {
            amount: true,
            type: true,
          },
        },
      },
    });

    // Calculate balance for each account
    const accountsWithSpent = accounts.map(account => {
      const totalCashIn = account.transactions
        .filter(t => t.type === 'Cash-in' || t.type === 'Cash-In')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const totalCashOut = account.transactions
        .filter(t => t.type === 'Cash-out' || t.type === 'Cash-Out')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const totalSpent = totalCashOut;
      const balance = account.budget + totalCashIn - totalCashOut;
      
      return {
        id: account.id,
        name: account.name,
        type: account.type,
        budget: account.budget,
        startDate: account.startDate,
        endDate: account.endDate,
        totalSpent,
        balance,
      };
    });

    return NextResponse.json(accountsWithSpent);
  } catch (err) {
    console.error('Error fetching accounts:', err);
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get current user for multi-tenancy
    const { getCurrentUser } = await import('@/lib/auth');
    const user = await getCurrentUser();
    if (!user || !user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, type, budget, startDate, endDate } = body;

    if (!name || !type || budget === undefined) {
      return NextResponse.json(
        { error: 'Name, type, and budget are required' },
        { status: 400 }
      );
    }

    const account = await prisma.account.create({
      data: {
        name,
        type,
        budget: parseFloat(budget),
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        companyId: user.companyId,
        siteId: user.siteId,
      },
    });

    return NextResponse.json(account, { status: 201 });
  } catch (err) {
    console.error('Error creating account:', err);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { getCurrentUser } = await import('@/lib/auth');
    const user = await getCurrentUser();
    if (!user || !user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { name, type, budget, startDate, endDate } = body;

    if (!name || !type || budget === undefined) {
      return NextResponse.json(
        { error: 'Name, type, and budget are required' },
        { status: 400 }
      );
    }

    const account = await prisma.account.update({
      where: { id: parseInt(id) },
      data: {
        name,
        type,
        budget: parseFloat(budget),
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    return NextResponse.json(account);
  } catch (err) {
    console.error('Error updating account:', err);
    return NextResponse.json(
      { error: 'Failed to update account' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    await prisma.account.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error('Error deleting account:', err);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
