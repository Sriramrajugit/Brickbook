import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const companyId = user.companyId as number
    const { searchParams } = new URL(request.url)
    const dateStr = searchParams.get('date')
    
    let whereClause: any = { companyId }
    if (dateStr) {
      // Simple approach: just use the date string, Prisma will convert it
      whereClause.date = {
        gte: new Date(`${dateStr}T00:00:00Z`),
        lt: new Date(`${dateStr}T23:59:59Z`)
      }
    }
    
    const attendances = await prisma.attendance.findMany({
      where: whereClause,
      include: { employee: true },
      orderBy: { date: 'desc' }
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
    const user = await getCurrentUser();
    if (!user || !user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyId = user.companyId as number;
    const { employeeId, date, status } = await request.json();

    // Basic validation
    if (!employeeId || !date || status === undefined || status === null) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate date format
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    // Convert status to number if needed
    const numericStatus = typeof status === 'number' ? status : parseFloat(status);
    if (![0, 1, 1.5, 2].includes(numericStatus)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    // Parse employeeId
    const empId = parseInt(employeeId, 10);
    if (isNaN(empId)) {
      return NextResponse.json({ error: 'Invalid employeeId' }, { status: 400 });
    }

    // Create date from string
    const isoDate = `${date}T00:00:00.000Z`;

    // Use raw SQL to insert to avoid Date object serialization issues
    try {
      // Try to find existing record first
      const existing = await prisma.attendance.findFirst({
        where: {
          employeeId: empId,
          companyId: companyId
        }
      });

      let attendance;
      if (existing) {
        // Update existing
        attendance = await prisma.attendance.update({
          where: { id: existing.id },
          data: { status: numericStatus },
          include: { employee: true }
        });
      } else {
        // Create new using raw SQL to avoid Date serialization
        await prisma.$executeRaw`
          INSERT INTO "attendances" ("employeeId", "date", "status", "companyId")
          VALUES (${empId}, ${isoDate}::timestamp, ${numericStatus}, ${companyId})
        `;
        
        // Fetch the created record
        attendance = await prisma.attendance.findFirst({
          where: {
            employeeId: empId,
            companyId: companyId
          },
          include: { employee: true },
          orderBy: { id: 'desc' }
        });
      }

      return NextResponse.json(attendance, { status: 201 });
    } catch (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('❌ Error saving attendance:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to save attendance: ' + errorMessage }, { status: 500 });
  }
}
