import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET - Fetch employees who already have payroll saved for a date range
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const companyId = user.companyId as number

    const searchParams = request.nextUrl.searchParams
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')

    if (!fromDate || !toDate) {
      return NextResponse.json(
        { error: 'fromDate and toDate are required' },
        { status: 400 }
      )
    }

    // Parse dates to normalize them to midnight UTC
    // Input format from frontend: "2024-01-15" (ISO date string)
    const startDate = new Date(`${fromDate}T00:00:00Z`);
    const endDate = new Date(`${toDate}T23:59:59Z`);

    console.log('🔍 Checking paid employees for date range:', { fromDate, toDate, startDate, endDate });

    // Fetch employees who already have payroll for OVERLAPPING date ranges
    // Date ranges overlap if: queryStart <= existingEnd AND queryEnd >= existingStart
    const paidPayrolls = await prisma.payroll.findMany({
      where: {
        companyId: companyId,
        fromDate: { lte: endDate },  // Existing payroll starts <= query end date
        toDate: { gte: startDate },  // Existing payroll ends >= query start date
      },
      select: {
        employeeId: true,
        fromDate: true,
        toDate: true,
      },
      distinct: ['employeeId'],
    });

    console.log('✅ Found paid payrolls:', paidPayrolls);

    return NextResponse.json(paidPayrolls)
  } catch (error) {
    console.error('Error fetching paid employees:', error)
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Detailed error:', errorMsg)
    return NextResponse.json(
      { 
        error: 'Failed to fetch paid employees',
        details: errorMsg
      },
      { status: 500 }
    )
  }
}
