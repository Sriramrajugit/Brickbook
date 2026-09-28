import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

/**
 * GET /api/audit/[recordId]
 * Fetch audit history for a specific record
 *
 * Path Parameters:
 * - recordId: number
 *
 * Query Parameters:
 * - module: string (required for filtering)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ recordId: string }> }
) {
  try {
    const { recordId: recordIdParam } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const recordId = parseInt(recordIdParam, 10);
    const module = request.nextUrl.searchParams.get('module');

    if (!module) {
      return NextResponse.json(
        { error: 'Module parameter is required' },
        { status: 400 }
      );
    }

    // Fetch all audit entries for this record
    const audits = await prisma.audit.findMany({
      where: {
        companyId: user.companyId,
        recordId,
        module,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    if (audits.length === 0) {
      return NextResponse.json(
        { error: 'No audit history found for this record' },
        { status: 404 }
      );
    }

    // Build a timeline showing state transitions
    const timeline = audits.map((audit: any, index: number) => ({
      ...audit,
      sequenceNumber: index + 1,
      // For UPDATE actions, show the diff
      diff:
        audit.action === 'UPDATE' && audit.beforeData && audit.afterData
          ? buildDiff(audit.beforeData, audit.afterData)
          : null,
    }));

    // Calculate final state (last afterData or before from last DELETE)
    let finalState = null;
    for (let i = audits.length - 1; i >= 0; i--) {
      if (audits[i].afterData) {
        finalState = audits[i].afterData;
        break;
      }
    }

    return NextResponse.json({
      recordId,
      module,
      timeline,
      finalState,
      totalChanges: audits.length,
    });
  } catch (error) {
    console.error('Error fetching audit history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit history' },
      { status: 500 }
    );
  }
}

/**
 * Build a diff object showing what changed between before and after
 */
function buildDiff(
  before: Record<string, any>,
  after: Record<string, any>
): Record<string, { before: any; after: any }> {
  const diff: Record<string, { before: any; after: any }> = {};

  // Check all keys in after
  Object.keys(after).forEach((key) => {
    if (before[key] !== after[key]) {
      diff[key] = {
        before: before[key] ?? null,
        after: after[key] ?? null,
      };
    }
  });

  // Check for deleted keys (in before but not in after)
  Object.keys(before).forEach((key) => {
    if (!(key in after)) {
      diff[key] = {
        before: before[key],
        after: null,
      };
    }
  });

  return diff;
}
