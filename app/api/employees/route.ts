import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// LIST employees
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
      // Don't include relations - they can cause performance issues
      select: {
        id: true,
        name: true,
        etype: true,
        salary: true,
        salaryFrequency: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(employees)
  } catch (error) {
    console.error('Error fetching employees:', error)
    const errorMsg = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: 'Failed to fetch employees', details: errorMsg },
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
    const { name, etype, salary, salaryFrequency, status } = body;

    console.log('📥 API received:', { name, etype, salary, salaryFrequency, status });

    const employee = await prisma.employee.create({
      data: {
        name,
        etype,
        salary: salary ? parseFloat(salary) : null,
        salaryFrequency: salaryFrequency || 'M',  // Already M or D from frontend
        status,
        companyId: user.companyId,
      },
      select: {
        id: true,
        name: true,
        etype: true,
        salary: true,
        salaryFrequency: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    console.log('✅ Created employee:', employee);
    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    console.error('Error creating employee:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Detailed error:', errorMsg);
    return NextResponse.json(
      { error: 'Failed to save employee', details: errorMsg },
      { status: 500 },
    );
  }
}

// UPDATE employee
export async function PUT(request: NextRequest) {
  try {
    // Get current user for multi-tenancy
    const { getCurrentUser } = await import('@/lib/auth');
    const user = await getCurrentUser();
    if (!user || !user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json()
    const { id, name, etype, salary, salaryFrequency, status } = body

    if (!id) {
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
    }

    console.log('📥 API received for update:', { id, name, etype, salary, salaryFrequency, status });

    const employee = await prisma.employee.update({
      where: { id: parseInt(id) },
      data: {
        name,
        etype,
        salary: salary ? parseFloat(salary) : null,
        salaryFrequency: salaryFrequency || 'M',  // Already M or D from frontend
        status,
      },
      select: {
        id: true,
        name: true,
        etype: true,
        salary: true,
        salaryFrequency: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    console.log('✅ Updated employee:', employee);
    return NextResponse.json(employee)
  } catch (error) {
    console.error('Error updating employee:', error)
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Failed to save employee', details: errorMsg },
      { status: 500 },
    )
  }
}
