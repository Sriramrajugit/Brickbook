import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(_req: NextRequest) {
  try {
    console.log('📋 GET /api/accounts/full called');
    
    // Get current user for multi-tenancy
    const user = await getCurrentUser();
    console.log('📋 getCurrentUser result:', user);
    
    if (!user || !user.companyId) {
      console.log('❌ No user or companyId:', { user, companyId: user?.companyId });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyId = user.companyId as number;
    console.log('📋 Fetching accounts for companyId:', companyId);

    const accounts = await prisma.account.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        state: true,
        zip: true,
        type: true,
        budget: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    console.log('📋 Found accounts:', accounts.length);

    // Return accounts in the expected format
    const result = accounts.map((account: any) => ({
      id: account.id,
      name: account.name,
      address: account.address || '',
      city: account.city || '',
      state: account.state || '',
      zip: account.zip || '',
      type: account.type || 'General',
      budget: account.budget,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    }));

    return NextResponse.json({
      data: result,
      pagination: {
        page: 1,
        limit: 100,
        total: result.length,
        totalPages: 1
      }
    });
  } catch (err) {
    console.error('Error fetching accounts:', err);
    return NextResponse.json(
      { error: 'Failed to fetch accounts', details: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
