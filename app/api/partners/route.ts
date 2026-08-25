import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const partnerType = searchParams.get('partnerType');
    const isActive = searchParams.get('isActive');
    const searchText = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    const skip = (page - 1) * limit;

    // Build filter conditions
    const where: any = {
      companyId: user.companyId,
    };

    if (partnerType) {
      where.partnerType = partnerType;
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (searchText) {
      where.OR = [
        { name: { contains: searchText, mode: 'insensitive' } },
        { email: { contains: searchText, mode: 'insensitive' } },
        { phone: { contains: searchText, mode: 'insensitive' } },
      ];
    }

    // Fetch partners
    const partners = await prisma.partner.findMany({
      where,
      orderBy: {
        [sortBy]: sortOrder.toLowerCase(),
      },
      skip,
      take: limit,
    });

    // Get total count
    const total = await prisma.partner.count({ where });
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: partners,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching partners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch partners' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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
      creditPeriodDays = 30,
      isActive = true,
    } = body;

    // Validate required fields
    if (!name || !partnerType) {
      return NextResponse.json(
        { error: 'Missing required fields: name, partnerType' },
        { status: 400 }
      );
    }

    // Create partner
    const partner = await prisma.partner.create({
      data: {
        companyId: user.companyId,
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

    return NextResponse.json({ data: partner }, { status: 201 });
  } catch (error) {
    console.error('Error creating partner:', error);
    return NextResponse.json(
      { error: 'Failed to create partner' },
      { status: 500 }
    );
  }
}
