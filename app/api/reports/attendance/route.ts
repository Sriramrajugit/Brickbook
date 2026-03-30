import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 })
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    // Include the entire end date (set to end of day)
    end.setHours(23, 59, 59, 999)

    // Get all employees for the company (exclude Supplier and Contractor)
    const employees = await prisma.employee.findMany({
      where: { companyId: user.companyId, status: 'Active', partnerType: 'Employee' },
      select: { id: true, name: true, etype: true, salaryFrequency: true },
      orderBy: { name: 'asc' },
    })

    // Get attendance records for the period
    const attendances = await prisma.attendance.findMany({
      where: {
        companyId: user.companyId,
        date: {
          gte: start,
          lte: end,
        },
      },
      select: { employeeId: true, date: true, status: true },
    })

    console.log(`[DEBUG] Attendance query - Date range: ${start.toISOString()} to ${end.toISOString()}`)
    console.log(`[DEBUG] Found ${attendances.length} attendance records`)
    
    // Show status distribution
    const statusDist: any = {}
    attendances.forEach((a: any) => {
      statusDist[a.status] = (statusDist[a.status] || 0) + 1
    })
    console.log(`[DEBUG] Status distribution:`, statusDist)

    // Get payroll records for the period
    const payrolls = await prisma.payroll.findMany({
      where: {
        companyId: user.companyId,
        fromDate: { gte: start },
        toDate: { lte: end },
      },
      select: { employeeId: true, amount: true, fromDate: true, toDate: true },
    })

    // Process data: aggregate per employee
    const reportData = employees.map((emp: any) => {
      const empAttendances = attendances.filter((a: any) => a.employeeId === emp.id)

      // Calculate total days (status >= 1 means present, status between 0.5 means half day)
      const totalDays = empAttendances.reduce((sum: number, a: any) => sum + a.status, 0)

      // OT hours - if status > 1, the extra is OT (e.g., 1.5 = 1 day + 0.5 OT, 2 = 1 day + 1 OT)
      const otHours = empAttendances.reduce((sum: number, a: any) => (a.status > 1 ? a.status - 1 : 0), 0)

      if (empAttendances.length > 0) {
        console.log(`[DEBUG] Employee ${emp.id} (${emp.name}): ${empAttendances.length} records, Days=${totalDays}, OT=${otHours}, Records:`, empAttendances.map((a:any) => ({date: a.date, status: a.status})))
      }

      return {
        employeeId: emp.id,
        employeeName: emp.name,
        employeeType: emp.etype || 'N/A',
        salaryFrequency: emp.salaryFrequency && emp.salaryFrequency.toLowerCase().startsWith('d') ? 'Daily' : 'Monthly',
        totalDays: Math.round(totalDays * 100) / 100,
        otHours: Math.round(otHours * 100) / 100,
      }
    })

    // Sort: Monthly first, then Daily, then by employee name
    reportData.sort((a: any, b: any) => {
      if (a.salaryFrequency !== b.salaryFrequency) {
        return a.salaryFrequency === 'Monthly' ? -1 : 1
      }
      return a.employeeName.localeCompare(b.employeeName)
    })

    return NextResponse.json({
      data: reportData,
      summary: {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        totalEmployees: reportData.length,
      },
    })
  } catch (error) {
    console.error('Error fetching attendance report:', error)
    return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 })
  }
}
