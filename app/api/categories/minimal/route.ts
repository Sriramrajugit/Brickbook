import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/categories/minimal - Returns ONLY id and name for dropdowns
export async function GET(_req: NextRequest) {
  try {
    // Get current user for multi-tenancy
    const user = await getCurrentUser();
    if (!user || !user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyId = user.companyId as number;

    const categories = await prisma.category.findMany({
      where: { companyId },
      // Select ONLY necessary fields
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(categories);
  } catch (err) {
    console.error('Error fetching minimal categories:', err);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 },
    );
  }
}
