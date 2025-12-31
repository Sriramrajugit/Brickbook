import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// LIST employees
export async function GET(request: NextRequest) {
  try {
    const employees = await prisma.employee.findMany({
      // uncomment next line if you want only active from DB
      // where: { status: 'Active' },
      include: {
        attendances: true,
        payrolls: true,
      },
    })

    return NextResponse.json(employees)
  } catch (error) {
    console.error('Error fetching employees:', error)
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 },
    )
  }
}

// CREATE employee
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, etype, salary, status } = body

    const employee = await prisma.employee.create({
      data: {
        name,
        etype,
        salary: salary ? parseFloat(salary) : null,
        status, // make sure your form sends this
      },
      include: {
        attendances: true,
        payrolls: true,
      },
    })

    return NextResponse.json(employee, { status: 201 })
  } catch (error) {
    console.error('Error creating employee:', error)
    return NextResponse.json(
      { error: 'Failed to save employee' },
      { status: 500 },
    )
  }
}

// UPDATE employee
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, etype, salary, status } = body

    const employee = await prisma.employee.update({
      where: { id: Number(id) },
      data: {
        name,
        etype,
        salary: salary ? parseFloat(salary) : null,
        status,
      },
      include: {
        attendances: true,
        payrolls: true,
      },
    })

    return NextResponse.json(employee)
  } catch (error) {
    console.error('Error updating employee:', error)
    return NextResponse.json(
      { error: 'Failed to save employee' },
      { status: 500 },
    )
  }
}
