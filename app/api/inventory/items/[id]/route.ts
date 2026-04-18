// app/api/inventory/items/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// PUT /api/inventory/items/[id]
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role === 'GUEST') {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    const params = await context.params;
    const body = await req.json();

    const item = await prisma.item.update({
      where: { id: parseInt(params.id) },
      data: {
        name: body.name || undefined,
        description: body.description || null,
        category: body.category || null,
        unit: body.unit || 'Bag',
        reorderLevel: body.reorderLevel ? Number(body.reorderLevel) : null,
        defaultRate: body.defaultRate ? Number(body.defaultRate) : null,
      },
    });

    return NextResponse.json(item);
  } catch (err: any) {
    console.error('Error updating item:', err);
    const message = err?.message || 'Failed to update item';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

// DELETE /api/inventory/items/[id]
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only Owner can delete items' },
        { status: 403 }
      );
    }

    const params = await context.params;

    await prisma.item.delete({
      where: { id: parseInt(params.id) },
    });

    return NextResponse.json({ message: 'Item deleted successfully' });
  } catch (err: any) {
    console.error('Error deleting item:', err);
    const message = err?.message || 'Failed to delete item';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
