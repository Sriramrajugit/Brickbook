import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET /api/employees/minimal - Returns ONLY id and name for dropdowns
export async function GET(request: NextRequest) {
  try {
    // Get current user for multi-tenancy
    const user = await getCurrentUser()
    if (!user || !user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const companyId = user.companyId as number

    const employees = await prisma.employee.findMany({
      where: { companyId },
      // Select ONLY necessary fields - NO dates, NO salary data
      // Include partnerType for category-based filtering
      select: {
        id: true,
        name: true,
        partnerType: true,
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(employees)
  } catch (error) {
    console.error('Error fetching minimal employees:', error)
    const errorMsg = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: 'Failed to fetch employees', details: errorMsg },
      { status: 500 },
    )
  }
}
