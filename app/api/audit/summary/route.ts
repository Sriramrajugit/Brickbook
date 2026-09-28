import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

/**
 * GET /api/audit/summary
 * Fetch audit statistics and summary information
 *
 * Query Parameters:
 * - startDate: ISO string (default: 30 days ago)
 * - endDate: ISO string (default: now)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    
    // Default to last 30 days
    const endDate = new Date(searchParams.get('endDate') || new Date().toISOString());
    const startDate = new Date(searchParams.get('startDate') || new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const where = {
      companyId: user.companyId,
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    };

    // Fetch all necessary data in parallel
    const [
      totalAudits,
      auditsByModule,
      auditsByAction,
      auditsByUser,
      recentAudits,
    ] = await Promise.all([
      // Total count
      prisma.audit.count({ where }),

      // Count by module
      prisma.audit.groupBy({
        by: ['module'],
        where,
        _count: true,
      }),

      // Count by action
      prisma.audit.groupBy({
        by: ['action'],
        where,
        _count: true,
      }),

      // Top users by audit count
      prisma.audit.groupBy({
        by: ['userId'],
        where,
        _count: true,
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 5,
      }),

      // Recent audits
      prisma.audit.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { timestamp: 'desc' },
        take: 10,
      }),
    ]);

    // Fetch user details for topUsers
    const userIds = auditsByUser.map((u: any) => u.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });

    const topUsers = auditsByUser.map((item: any) => {
      const userData = users.find((u: any) => u.id === item.userId);
      return {
        userId: item.userId,
        userName: userData?.name || 'Unknown',
        userEmail: userData?.email || 'N/A',
        count: item._count,
      };
    });

    // Build module summary
    const moduleSummary = auditsByModule.map((item: any) => ({
      module: item.module,
      count: item._count,
    }));

    // Build action summary
    const actionSummary = auditsByAction.map((item: any) => ({
      action: item.action,
      count: item._count,
    }));

    return NextResponse.json({
      summary: {
        totalAudits,
        dateRange: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        byModule: moduleSummary,
        byAction: actionSummary,
        topUsers,
      },
      recent: recentAudits,
    });
  } catch (error) {
    console.error('Error fetching audit summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit summary' },
      { status: 500 }
    );
  }
}
