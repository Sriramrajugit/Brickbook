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

    // Fetch all active employees for this company
    const employees = await prisma.employee.findMany({
      where: {
        companyId: companyId,
        status: 'Active',
      },
      select: {
        id: true,
        name: true,
        salary: true,
      },
    })

    // For each employee, calculate payroll data
    const payrollPreview = await Promise.all(
      employees.map(async (emp) => {
        // Fetch attendance records
        const attendance = await prisma.attendance.findMany({
          where: {
            employeeId: emp.id,
            date: { gte: new Date(fromDate), lte: new Date(toDate) },
          },
        })

        // Calculate gross salary based on attendance multiplier
        // Simply multiply daily salary by the attendance status value
        const dailySalary = emp.salary || 0
        const grossSalary = attendance.reduce((sum, record) => {
          return sum + (dailySalary * record.status)
        }, 0)

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
          baseSalary: emp.salary || 0, // Base daily salary from employee record
          salary: grossSalary, // Calculated gross salary based on attendance multipliers
          attendance,
          totalAdvance: totalAdvance || 0,
          totalSalaryPaid: salaryTx._sum.amount || 0,
        }
      })
    )

    return NextResponse.json(payrollPreview)
  } catch (error) {
    console.error('Error fetching payroll:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payroll records' },
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

    // Validation
    if (!employeeId || !accountId || !fromDate || !toDate || amount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if payroll already exists for this employee in the same date range
    const existingPayroll = await prisma.payroll.findFirst({
      where: {
        employeeId: parseInt(employeeId),
        fromDate: new Date(fromDate),
        toDate: new Date(toDate),
        companyId: companyId,
      },
    })

    if (existingPayroll) {
      return NextResponse.json(
        { error: 'Payroll updates completed for this week' },
        { status: 409 }
      )
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
    return NextResponse.json(
      { error: 'Failed to create payroll record' },
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
