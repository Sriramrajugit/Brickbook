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

    const partner = await prisma.partner.findUnique({
      where: { id: parseInt(id) },
    });

    if (!partner || partner.companyId !== user.companyId) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    return NextResponse.json({ data: partner });
  } catch (error) {
    console.error('Error fetching partner:', error);
    return NextResponse.json({ error: 'Failed to fetch partner' }, { status: 500 });
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
    const {
      name,
      email,
      phone,
      address,
      partnerType,
      gstNumber,
      creditPeriodDays,
      isActive,
    } = body;

    // Verify partner exists and belongs to company
    const existingPartner = await prisma.partner.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingPartner || existingPartner.companyId !== user.companyId) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    // Update partner
    const updatedPartner = await prisma.partner.update({
      where: { id: parseInt(id) },
      data: {
        name,
        email,
        phone,
        address,
        partnerType,
        gstNumber,
        creditPeriodDays,
        isActive,
      },
    });

    return NextResponse.json({ data: updatedPartner });
  } catch (error) {
    console.error('Error updating partner:', error);
    return NextResponse.json(
      { error: 'Failed to update partner' },
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

    // Verify partner exists and belongs to company
    const partner = await prisma.partner.findUnique({
      where: { id: parseInt(id) },
    });

    if (!partner || partner.companyId !== user.companyId) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    // Delete partner (bills will cascade delete if configured)
    await prisma.partner.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({
      message: 'Partner deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting partner:', error);
    return NextResponse.json(
      { error: 'Failed to delete partner' },
      { status: 500 }
    );
  }
}
