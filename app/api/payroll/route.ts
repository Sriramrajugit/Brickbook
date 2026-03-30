import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET - Fetch payroll preview data for a date range
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

    // Fetch all active employees for this company (excluding Suppliers and Contractors)
    const employees = await prisma.employee.findMany({
      where: {
        companyId: companyId,
        status: 'Active',
        partnerType: 'Employee', // Only fetch actual employees, not suppliers or contractors
      },
      select: {
        id: true,
        name: true,
        salary: true,
        salaryFrequency: true,
      },
    })

    // For each employee, calculate payroll data
    const payrollPreview = await Promise.all(
      employees.map(async (emp: any) => {
        // Fetch attendance records
        const attendance = await prisma.attendance.findMany({
          where: {
            employeeId: emp.id,
            date: { gte: new Date(fromDate), lte: new Date(toDate) },
          },
        })

        // Calculate gross salary based on salary frequency
        let grossSalary = 0
        
        if (emp.salaryFrequency === 'D') {
          // Daily Employee: Salary based on attendance (no of days * daily rate + OT)
          const dailySalary = emp.salary || 0
          grossSalary = attendance.reduce((sum: number, record: any) => {
            return sum + (dailySalary * record.status)
          }, 0)
        } else {
          // Monthly Employee: Fixed monthly salary
          grossSalary = emp.salary || 0
        }

        // Sum advances for this employee in the period from Advance table
        const advancesData = await prisma.advance.aggregate({
          _sum: { amount: true },
          where: {
            employeeId: emp.id,
            companyId: companyId,
            date: { gte: new Date(fromDate), lte: new Date(toDate) },
          },
        })
        
        const totalAdvance = advancesData._sum.amount || 0

        // Sum salary transactions with "Salary" category for this employee in the period
        const salaryTx = await prisma.transaction.aggregate({
          _sum: { amount: true },
          where: {
            category: 'Salary',
            companyId: companyId,
            date: { gte: new Date(fromDate), lte: new Date(toDate) },
          },
        })

        return {
          employeeId: emp.id,
          employeeName: emp.name,
          salaryFrequency: emp.salaryFrequency,
          baseSalary: emp.salary || 0, // Base daily/monthly salary from employee record
          salary: grossSalary, // Calculated gross salary
          attendance,
          totalAdvance: totalAdvance || 0,
          totalSalaryPaid: salaryTx._sum.amount || 0,
        }
      })
    )

    return NextResponse.json(payrollPreview)
  } catch (error) {
    console.error('Error fetching payroll:', error)
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Detailed error:', errorMsg)
    return NextResponse.json(
      { 
        error: 'Failed to fetch payroll records',
        details: errorMsg // Return detailed error for debugging
      },
      { status: 500 }
    )
  }
}

// POST - Create new payroll record
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const companyId = user.companyId as number

    const body = await request.json()
    const { employeeId, accountId, fromDate, toDate, amount, remarks } = body

    console.log('📥 Payroll POST received:', { employeeId, accountId, fromDate, toDate, amount, remarks })

    // Validation
    if (!employeeId || !accountId || !fromDate || !toDate || amount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get employee to check salary frequency
    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(employeeId) },
      select: { salaryFrequency: true },
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    const fromDateObj = new Date(fromDate);
    const toDateObj = new Date(toDate);

    // Check if payroll already exists for this employee in OVERLAPPING date ranges
    // Two ranges overlap if: range1.start <= range2.end AND range1.end >= range2.start
    const existingPayroll = await prisma.payroll.findFirst({
      where: {
        employeeId: parseInt(employeeId),
        companyId: companyId,
        fromDate: { lte: toDateObj },      // Existing payroll starts <= query end date
        toDate: { gte: fromDateObj },      // Existing payroll ends >= query start date
      },
    })

    if (existingPayroll) {
      return NextResponse.json(
        { error: `Payroll already exists for an overlapping date range (${new Date(existingPayroll.fromDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(existingPayroll.toDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}). Please select a different date range.` },
        { status: 409 }
      )
    }

    // For monthly employees, check if payroll already exists for this calendar month
    if (employee.salaryFrequency === 'M') {
      // Get first and last day of the month for the period
      const year = fromDateObj.getFullYear()
      const month = fromDateObj.getMonth()
      const monthStart = new Date(year, month, 1)
      const monthEnd = new Date(year, month + 1, 0)

      // Check for overlapping payrolls in the same calendar month
      const monthlyPayrollExists = await prisma.payroll.findFirst({
        where: {
          employeeId: parseInt(employeeId),
          companyId: companyId,
          fromDate: { lte: monthEnd },    // Existing payroll starts <= month end
          toDate: { gte: monthStart },   // Existing payroll ends >= month start
        },
      })

      if (monthlyPayrollExists) {
        return NextResponse.json(
          { error: `Monthly payroll already processed for ${monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}. Monthly employees can only be paid once per month.` },
          { status: 409 }
        )
      }
    }

    const payroll = await prisma.payroll.create({
      data: {
        employeeId: parseInt(employeeId),
        accountId: parseInt(accountId),
        fromDate: new Date(fromDate),
        toDate: new Date(toDate),
        amount: parseFloat(amount),
        remarks: remarks || null,
        companyId: companyId,
      },
      include: {
        employee: true,
      },
    })

    return NextResponse.json(payroll, { status: 201 })
  } catch (error) {
    console.error('Error creating payroll:', error)
    const errorMsg = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { 
        error: 'Failed to create payroll record',
        details: errorMsg 
      },
      { status: 500 }
    )
  }
}

// DELETE - Delete a payroll record
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Payroll ID is required' },
        { status: 400 }
      )
    }

    await prisma.payroll.delete({
      where: { id: parseInt(id) },
    })

    return NextResponse.json({ message: 'Payroll record deleted successfully' })
  } catch (error) {
    console.error('Error deleting payroll:', error)
    return NextResponse.json(
      { error: 'Failed to delete payroll record' },
      { status: 500 }
    )
  }
}
