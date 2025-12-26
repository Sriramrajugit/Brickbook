import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Fetch all payroll records
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')
    const employeeId = searchParams.get('employeeId')
    const accountId = searchParams.get('accountId')

    const where: any = {}
    
    if (fromDate && toDate) {
      where.fromDate = { gte: new Date(fromDate) }
      where.toDate = { lte: new Date(toDate) }
    }
    
    if (employeeId) {
      where.employeeId = parseInt(employeeId)
    }
    
    if (accountId) {
      where.accountId = parseInt(accountId)
    }

    const payrolls = await prisma.payroll.findMany({
      where,
      include: {
        employee: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(payrolls)
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
    const body = await request.json()
    const { employeeId, accountId, fromDate, toDate, amount, remarks } = body

    // Validation
    if (!employeeId || !accountId || !fromDate || !toDate || amount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
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
      },
      include: {
        employee: true,
      }
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
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Payroll ID is required' },
        { status: 400 }
      )
    }

    await prisma.payroll.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting payroll:', error)
    return NextResponse.json(
      { error: 'Failed to delete payroll record' },
      { status: 500 }
    )
  }
}
