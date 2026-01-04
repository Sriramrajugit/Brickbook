import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Get current user for multi-tenancy
    const user = await getCurrentUser()
    if (!user || !user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const companyId = user.companyId as number
    const { searchParams } = new URL(request.url)
    const dateStr = searchParams.get('date')  // "2025-12-25"
    
    let whereClause: any = { companyId }
    if (dateStr) {
      // ✅ FIX: Convert "2025-12-25" → Date object for Prisma DateTime
      const date = new Date(dateStr + 'T00:00:00.000Z')
      whereClause.date = {
        equals: date
      }
    }
    
    const attendances = await prisma.attendance.findMany({
      where: whereClause,
      include: { 
        employee: true 
      },
      orderBy: { 
        date: 'desc' 
      }
    })
    
    console.log(`📊 Found ${attendances.length} records for ${dateStr || 'all'}`)
    return NextResponse.json(attendances)
  } catch (error) {
    console.error('❌ Error fetching attendance:', error)
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get current user for multi-tenancy
    const { getCurrentUser } = await import('@/lib/auth');
    const user = await getCurrentUser();
    if (!user || !user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyId = user.companyId as number;

    const { employeeId, date, status } = await request.json();

    // Validate status is a valid numeric multiplier
    const validStatuses: Record<string, number> = {
      'Present': 1,
      'OT4Hrs': 1.5,
      'OT8Hrs': 2,
      'Absent': 0
    };

    let numericStatus: number;
    if (typeof status === 'number') {
      // If already numeric, validate it's a valid value
      numericStatus = status;
    } else if (validStatuses[status]) {
      // If string, convert to numeric
      numericStatus = validStatuses[status];
    } else {
      return NextResponse.json(
        { error: 'Invalid attendance status' },
        { status: 400 }
      );
    }

    // ✅ FIX: Convert date string to DateTime for POST too
    const dateTime = new Date(date + 'T00:00:00.000Z');

    // Validate: Future dates are not allowed
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const attendanceDate = new Date(dateTime);
    attendanceDate.setHours(0, 0, 0, 0);

    if (attendanceDate > today) {
      return NextResponse.json(
        { error: 'Future date attendance is not allowed' },
        { status: 400 }
      );
    }

    const attendance = await prisma.attendance.upsert({
      where: {
        employeeId_date: {
          employeeId: parseInt(employeeId),
          date: dateTime // ✅ Use Date object
        }
      },
      update: { status: numericStatus },
      create: {
        employeeId: parseInt(employeeId),
        date: dateTime, // ✅ Use Date object
        status: numericStatus,
        companyId: companyId,
        // siteId is not required in Attendance, but add if needed:
        // siteId: user.siteId ?? undefined,
      },
      include: { employee: true }
    });

    return NextResponse.json(attendance, { status: 201 });
  } catch (error) {
    console.error('❌ Error saving attendance:', error);
    return NextResponse.json({ error: 'Failed to save attendance' }, { status: 500 });
  }
}
