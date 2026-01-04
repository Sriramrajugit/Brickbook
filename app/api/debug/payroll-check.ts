import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// Debug endpoint to check payroll API status
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Test 1: Database connection
    const dbTest = await prisma.$queryRaw`SELECT 1`
    
    // Test 2: Count employees
    const employeeCount = await prisma.employee.count({
      where: { companyId: user.companyId }
    })
    
    // Test 3: Count attendance
    const attendanceCount = await prisma.attendance.count()
    
    // Test 4: Count advances
    const advanceCount = await prisma.advance.count()

    return NextResponse.json({
      status: 'OK',
      database: 'Connected',
      user: {
        id: user.id,
        companyId: user.companyId,
      },
      data: {
        employees: employeeCount,
        attendance: attendanceCount,
        advances: advanceCount,
      }
    })
  } catch (error) {
    console.error('Debug check failed:', error)
    return NextResponse.json({
      status: 'ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
      error: String(error)
    }, { status: 500 })
  }
}
