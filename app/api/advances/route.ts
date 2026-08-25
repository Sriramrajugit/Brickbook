import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// LIST advances
export async function GET(request: NextRequest) {
  try {
    // Get current user for multi-tenancy
    const user = await getCurrentUser()
    if (!user || !user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const companyId = user.companyId as number

    const advances = await prisma.advance.findMany({
      where: { companyId },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    })

    return NextResponse.json(advances)
  } catch (error) {
    console.error('Error fetching advances:', error)
    return NextResponse.json(
      { error: 'Failed to fetch advances' },
      { status: 500 },
    )
  }
}

// CREATE advance
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const companyId = user.companyId as number

    const body = await request.json()
    const { employeeId, amount, reason, date, transactionId } = body

    // Validate required fields
    if (!employeeId || !amount || !date) {
      return NextResponse.json(
        { error: 'Employee, amount, and date are required' },
        { status: 400 },
      )
    }

    // Verify employee exists and is active
    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(employeeId) },
    })

    if (!employee || employee.companyId !== companyId) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 },
      )
    }

    if (employee.status !== 'Active') {
      return NextResponse.json(
        { error: 'Employee is not active' },
        { status: 400 },
      )
    }

    const advance = await prisma.advance.create({
      data: {
        employeeId: parseInt(employeeId),
        companyId: companyId,
        amount: parseFloat(amount),
        reason: reason || null,
        date: new Date(date),
        transactionId: transactionId ? parseInt(transactionId) : null,
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    })

    return NextResponse.json(advance, { status: 201 })
  } catch (error) {
    console.error('Error creating advance:', error)
    return NextResponse.json(
      { error: 'Failed to save advance' },
      { status: 500 },
    )
  }
}

// UPDATE advance
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, employeeId, amount, reason, date } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Advance ID is required' },
        { status: 400 },
      )
    }

    const advance = await prisma.advance.update({
      where: { id: Number(id) },
      data: {
        employeeId: employeeId ? parseInt(employeeId) : undefined,
        amount: amount ? parseFloat(amount) : undefined,
        reason: reason !== undefined ? reason : undefined,
        date: date ? new Date(date) : undefined,
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    })

    return NextResponse.json(advance)
  } catch (error) {
    console.error('Error updating advance:', error)
    return NextResponse.json(
      { error: 'Failed to update advance' },
      { status: 500 },
    )
  }
}

// DELETE advance (by ID or transactionId)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let transactionId: string | null = null;
    let id: string | null = null;
    
    // Try to get transactionId first (preferred for transaction-linked advances)
    transactionId = searchParams.get('transactionId');
    
    // If no transactionId, try to get id from query or body
    if (!transactionId) {
      try {
        const body = await request.json();
        id = body.id ? body.id.toString() : null;
      } catch (e) {
        // No body, try query params
        id = searchParams.get('id');
      }
    }

    if (!transactionId && !id) {
      return NextResponse.json(
        { error: 'Advance ID or Transaction ID is required' },
        { status: 400 },
      )
    }

    // Delete by transaction ID (more reliable for Salary Advance/Salary transactions)
    if (transactionId) {
      await prisma.advance.deleteMany({
        where: { transactionId: parseInt(transactionId) },
      })
    } else if (id) {
      // Fallback: delete by advance ID
      await prisma.advance.delete({
        where: { id: Number(id) },
      })
    }

    return NextResponse.json({ message: 'Advance deleted successfully' })
  } catch (error) {
    console.error('Error deleting advance:', error)
    return NextResponse.json(
      { error: 'Failed to delete advance' },
      { status: 500 },
    )
  }
}
