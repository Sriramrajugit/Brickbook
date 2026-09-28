import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

/**
 * GET /api/audit
 * Fetch audit logs with filtering, pagination, and sorting
 *
 * Query Parameters:
 * - page: number (default: 1)
 * - limit: number (default: 10)
 * - module: string (LOGIN, TRANSACTION, CATEGORY, EMPLOYEE, BILL)
 * - action: string (CREATE, UPDATE, DELETE, LOGIN, LOGOUT)
 * - startDate: ISO string
 * - endDate: ISO string
 * - userId: number
 * - recordId: number
 * - sortBy: string (timestamp, module, action, userId) - default: timestamp
 * - sortOrder: asc | desc (default: desc)
 * - search: string (searches in description)
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 100);
    const module = searchParams.get('module');
    const action = searchParams.get('action');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const userId = searchParams.get('userId');
    const recordId = searchParams.get('recordId');
    const sortBy = searchParams.get('sortBy') || 'timestamp';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {
      companyId: user.companyId,
    };

    if (module) where.module = module;
    if (action) where.action = action;
    if (userId) where.userId = parseInt(userId, 10);
    if (recordId) where.recordId = parseInt(recordId, 10);

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    if (search) {
      where.description = {
        contains: search,
        mode: 'insensitive',
      };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch audit logs
    const [audits, total] = await Promise.all([
      prisma.audit.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      prisma.audit.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: audits,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
