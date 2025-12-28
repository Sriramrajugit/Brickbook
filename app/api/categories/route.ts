import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/categories
export async function GET(_req: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
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
        description: description?.trim() || null,
      },
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

    const category = await prisma.category.update({
      where: { id: parseInt(id) },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
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
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 },
      );
    }

    await prisma.category.delete({
      where: { id: parseInt(id) },
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
