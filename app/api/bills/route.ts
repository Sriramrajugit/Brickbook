import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { createAudit, getClientIP, getUserAgent } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const employeeId = searchParams.get('employeeId');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const sortBy = searchParams.get('sortBy') || 'billDate';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Build filter conditions
    const where: any = {
      companyId: user.companyId,
    };

    if (employeeId) {
      where.employeeId = parseInt(employeeId);
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.billDate = {};
      if (startDate) where.billDate.gte = new Date(startDate);
      if (endDate) where.billDate.lte = new Date(endDate);
    }

    // Fetch bills
    const bills = await prisma.partnerBill.findMany({
      where,
      include: {
        employee: true,
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
      orderBy: {
        [sortBy]: sortOrder.toLowerCase(),
      },
      skip,
      take: limit,
    });

    // Get total count
    const total = await prisma.partnerBill.count({ where });
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: bills,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching bills:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bills' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      employeeId,
      accountId,
      invoiceNo,
      billDate,
      dueDate,
      amount,
      paidAmount,
      billImagePath,
      paymentMode = 'GPAY',
      remarks,
    } = body;

    // Validate required fields
    if (!employeeId || !accountId || !invoiceNo || !billDate || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: employeeId, accountId, invoiceNo, billDate, amount' },
        { status: 400 }
      );
    }

    // Verify employee exists and belongs to company
    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(employeeId) },
    });

    if (!employee || employee.companyId !== user.companyId) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Verify account exists and belongs to company
    const account = await prisma.account.findUnique({
      where: { id: parseInt(accountId) },
    });

    if (!account || account.companyId !== user.companyId) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Calculate bill status based on paid amount
    const totalAmount = parseFloat(amount);
    const paid = paidAmount ? parseFloat(paidAmount) : 0;
    let billStatus: string = 'UNPAID';
    if (paid > 0) {
      if (paid >= totalAmount) {
        billStatus = 'FULLY_PAID';
      } else {
        billStatus = 'PARTIALLY_PAID';
      }
    }

    // Extract user values for transaction (TypeScript type narrowing)
    const userId = user.id;
    const companyId = user.companyId;
    const siteId = user.siteId || null;

    // Use transaction to ensure atomicity
    const bill = await prisma.$transaction(async (tx: any) => {
      // Create bill with accountId
      const newBill = await tx.partnerBill.create({
        data: {
          companyId: companyId,
          employeeId: parseInt(employeeId),
          accountId: parseInt(accountId),
          invoiceNo,
          billDate: new Date(billDate),
          dueDate: dueDate ? new Date(dueDate) : null,
          amount: totalAmount,
          paidAmount: paid,
          billImagePath,
          remarks: remarks || null,
          status: billStatus,
        },
      });

      // If paidAmount > 0, create payment record and transaction entry
      if (paid > 0) {
        // Create payment record
        await tx.partnerBillPayment.create({
          data: {
            companyId: companyId,
            billId: newBill.id,
            paymentDate: new Date(billDate),
            amount: paid,
            paymentMode,
          },
        });

        // Create transaction entry
        await tx.transaction.create({
          data: {
            amount: paid,
            description: `Payment for ${employee.name} - Invoice ${invoiceNo}`,
            category: 'To Supplier',
            type: 'Cash-Out',
            date: new Date(billDate),
            accountId: parseInt(accountId),
            paymentMode,
            categoryId: null,
            createdBy: userId,
            companyId: companyId,
            siteId: siteId,
          },
        });
      }

      // Return bill with relations
      return await tx.partnerBill.findUnique({
        where: { id: newBill.id },
        include: {
          employee: true,
          account: true,
          payments: true,
        },
      });
    });

    // Create audit log
    await createAudit({
      companyId: user.companyId,
      module: 'BILL',
      action: 'CREATE',
      recordId: bill.id,
      userId: user.id,
      afterData: bill,
      description: `Created bill: Invoice ${invoiceNo} for ${employee.name} - ₹${amount}`,
      ipAddress: getClientIP(request.headers),
      userAgent: getUserAgent(request.headers),
    });

    return NextResponse.json({ data: bill }, { status: 201 });
  } catch (error) {
    console.error('Error creating bill:', error);
    return NextResponse.json(
      { error: 'Failed to create bill' },
      { status: 500 }
    );
  }
}
