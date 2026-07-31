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
    console.log('📋 GET /api/accounts called');
    
    // Get current user for multi-tenancy
    const user = await getCurrentUser();
    console.log('📋 getCurrentUser result:', user);
    
    if (!user || !user.companyId) {
      console.log('❌ No user or companyId:', { user, companyId: user?.companyId });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyId = user.companyId as number;
    console.log('📋 Fetching accounts for companyId:', companyId);

    try {
      const accounts = await prisma.account.findMany({
        where: { companyId },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          type: true,
          budget: true,
          startDate: true,
          endDate: true,
          companyId: true,
          createdAt: true,
          updatedAt: true,
        }
      });
      
      console.log('📋 Found accounts:', accounts.length);

      const response = NextResponse.json({
        data: accounts,
        pagination: {
          page: 1,
          limit: 100,
          total: accounts.length,
          totalPages: 1
        }
      });
      response.headers.set('Access-Control-Allow-Origin', '*');
      return response;
    } catch (dbErr) {
      console.error('❌ Database error:', dbErr);
      throw dbErr;
    }
  } catch (err) {
    console.error('❌ Error fetching accounts:', err);
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Error details:', errorMsg);
    return NextResponse.json(
      { error: 'Failed to fetch accounts', details: errorMsg },
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
    const { name, type, budget, address, startDate, endDate } = body;

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
    const { name, type, budget, address, startDate, endDate } = body;

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
        address: address || null,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
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
