import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bill = await prisma.partnerBill.findUnique({
      where: { id: parseInt(id) },
      include: {
        employee: true,
        account: true,
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    if (!bill || bill.companyId !== user.companyId) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    return NextResponse.json({ data: bill });
  } catch (error) {
    console.error('Error fetching bill:', error);
    return NextResponse.json({ error: 'Failed to fetch bill' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { invoiceNo, billDate, dueDate, amount, billImagePath, remarks } = body;

    // Verify bill exists and belongs to company
    const existingBill = await prisma.partnerBill.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingBill || existingBill.companyId !== user.companyId) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    // Update bill
    const updatedBill = await prisma.partnerBill.update({
      where: { id: parseInt(id) },
      data: {
        invoiceNo,
        billDate: billDate ? new Date(billDate) : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        amount: amount ? parseFloat(amount) : undefined,
        billImagePath,
        remarks: remarks !== undefined ? remarks : undefined,
      },
      include: {
        employee: true,
        payments: true,
      },
    });

    return NextResponse.json({ data: updatedBill });
  } catch (error) {
    console.error('Error updating bill:', error);
    return NextResponse.json(
      { error: 'Failed to update bill' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify bill exists and belongs to company
    const bill = await prisma.partnerBill.findUnique({
      where: { id: parseInt(id) },
    });

    if (!bill || bill.companyId !== user.companyId) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    // Delete bill (payments will cascade delete)
    await prisma.partnerBill.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({
      message: 'Bill deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting bill:', error);
    return NextResponse.json(
      { error: 'Failed to delete bill' },
      { status: 500 }
    );
  }
}
