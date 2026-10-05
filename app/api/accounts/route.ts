import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function GET(_req: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || !user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyId = user.companyId as number;

    // Build where clause: filter by company, and by site if user is a Site Manager
    const where: any = { companyId };
    if (user.siteId) {
      where.siteId = user.siteId;
    }

    // Get basic account info
    const accounts = await prisma.account.findMany({
      where,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        type: true,
        budget: true,
        startDate: true,
        endDate: true,
        projectStatus: true,
      }
    });

    // For each account, fetch transaction aggregations
    const accountsWithData = await Promise.all(
      accounts.map(async (account: any) => {
        // Sum of Cash-Out transactions (expenses)
        const cashOutResult = await prisma.transaction.aggregate({
          where: {
            accountId: account.id,
            type: { in: ['Cash-Out', 'Cash-out'] }
          },
          _sum: { amount: true }
        });

        // Sum of Cash-In transactions (received)
        const cashInResult = await prisma.transaction.aggregate({
          where: {
            accountId: account.id,
            type: { in: ['Cash-In', 'Cash-in'] }
          },
          _sum: { amount: true }
        });

        const totalSpent = cashOutResult._sum.amount || 0;
        const totalReceived = cashInResult._sum.amount || 0;
        const balance = account.budget - totalSpent;

        return {
          ...account,
          totalSpent,
          totalReceived,
          balance
        };
      })
    );

    const response = NextResponse.json({
      data: accountsWithData,
      pagination: {
        page: 1,
        limit: 100,
        total: accountsWithData.length,
        totalPages: 1
      }
    });
    response.headers.set('Access-Control-Allow-Origin', '*');
    return response;
  } catch (err) {
    console.error('❌ Error fetching accounts:', err);
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

    const companyId = user.companyId as number

    const body = await req.json();
    const { name, type, budget, address, startDate, endDate, projectStatus } = body;

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
        address: address || null,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        projectStatus: projectStatus || 'Yet to start',
        companyId: companyId,
        siteId: user.siteId ?? undefined,
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
    const { name, type, budget, address, startDate, endDate, projectStatus } = body;

    console.log('📝 API Received PUT body:', { name, type, budget, address, startDate, endDate, projectStatus });

    if (!name || !type || budget === undefined) {
      return NextResponse.json(
        { error: 'Name, type, and budget are required' },
        { status: 400 }
      );
    }

    console.log('🔄 Updating account ID:', id, 'with projectStatus:', projectStatus);

    const account = await prisma.account.update({
      where: { id: parseInt(id) },
      data: {
        name,
        type,
        budget: parseFloat(budget),
        address: address || null,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        projectStatus: projectStatus || 'Yet to start',
      },
    });

    console.log('✅ Account updated:', account);
    return NextResponse.json(account);
  } catch (err) {
    console.error('❌ Error updating account:', err);
    return NextResponse.json(
      { error: 'Failed to update account', details: String(err) },
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
