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
    // Get current user for multi-tenancy
    const { getCurrentUser } = await import('@/lib/auth');
    const user = await getCurrentUser();
    if (!user || !user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, etype, salary, status } = body;

    const employee = await prisma.employee.create({
      data: {
        name,
        etype,
        salary: salary ? parseFloat(salary) : null,
        status,
        companyId: user.companyId,
        // siteId is not required in Employee, but add if needed:
        siteId: user.siteId ?? undefined,
      },
      include: {
        attendances: true,
        payrolls: true,
      },
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    console.error('Error creating employee:', error);
    return NextResponse.json(
      { error: 'Failed to save employee' },
      { status: 500 },
    );
  }
}

// UPDATE employee
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, etype, salary, status } = body


    const employee = await prisma.employee.create({
      data: {
        name: body.name,
        etype: body.etype,
        salary: Number(body.salary) || 0,
        status: body.status || 'Active',
        companyId: user.companyId,
        siteId: user.siteId,
      },
      include: {
        attendances: true,
        payrolls: true,
      },
    });

    return NextResponse.json(employee)
  } catch (error) {
    console.error('Error updating employee:', error)
    return NextResponse.json(
      { error: 'Failed to save employee' },
      { status: 500 },
    )
  }
}
