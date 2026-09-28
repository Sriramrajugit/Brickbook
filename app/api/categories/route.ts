import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { createAudit, getClientIP, getUserAgent } from '@/lib/audit';

// GET /api/categories
export async function GET(_req: NextRequest) {
  try {
    // Get current user for multi-tenancy
    const user = await getCurrentUser();
    if (!user || !user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyId = user.companyId as number;

    const categories = await prisma.category.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(categories);
  } catch (err) {
    console.error('Error fetching categories:', err);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 },
    );
  }
}

// POST /api/categories
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.companyId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const companyId = user.companyId as number;

    const body = await req.json();
    const { name, description } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 },
      );
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        description: description?.trim() || undefined,
        companyId: companyId,
      },
    });

    // Create audit log
    await createAudit({
      companyId,
      module: 'CATEGORY',
      action: 'CREATE',
      recordId: category.id,
      userId: user.id,
      afterData: category,
      description: `Created category: ${category.name}`,
      ipAddress: getClientIP(req.headers),
      userAgent: getUserAgent(req.headers),
    });

    return NextResponse.json(category);
  } catch (err: any) {
    console.error('Error creating category:', err);
    if (err.code === 'P2002') {
      return NextResponse.json(
        { error: 'Category name already exists' },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 },
    );
  }
}

// PUT /api/categories?id=1
export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.companyId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 },
      );
    }

    const body = await req.json();
    const { name, description } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 },
      );
    }

    // Fetch original category for audit
    const originalCategory = await prisma.category.findUnique({
      where: { id: parseInt(id) },
    });

    if (!originalCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 },
      );
    }

    const category = await prisma.category.update({
      where: { id: parseInt(id) },
      data: {
        name: name.trim(),
        description: description?.trim() || undefined,
      },
    });

    // Create audit log
    await createAudit({
      companyId: user.companyId,
      module: 'CATEGORY',
      action: 'UPDATE',
      recordId: parseInt(id),
      userId: user.id,
      beforeData: originalCategory,
      afterData: category,
      description: `Updated category: ${category.name}`,
      ipAddress: getClientIP(req.headers),
      userAgent: getUserAgent(req.headers),
    });

    return NextResponse.json(category);
  } catch (err: any) {
    console.error('Error updating category:', err);
    if (err.code === 'P2002') {
      return NextResponse.json(
        { error: 'Category name already exists' },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 },
    );
  }
}

// DELETE /api/categories?id=1
export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.companyId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 },
      );
    }

    // Fetch category before deletion for audit
    const categoryBeforeDelete = await prisma.category.findUnique({
      where: { id: parseInt(id) },
    });

    if (!categoryBeforeDelete) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 },
      );
    }

    await prisma.category.delete({
      where: { id: parseInt(id) },
    });

    // Create audit log
    await createAudit({
      companyId: user.companyId,
      module: 'CATEGORY',
      action: 'DELETE',
      recordId: parseInt(id),
      userId: user.id,
      beforeData: categoryBeforeDelete,
      description: `Deleted category: ${categoryBeforeDelete.name}`,
      ipAddress: getClientIP(req.headers),
      userAgent: getUserAgent(req.headers),
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting category:', err);
    if (err.code === 'P2003') {
      return NextResponse.json(
        { error: 'Cannot delete category that is linked to transactions' },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 },
    );
  }
}
