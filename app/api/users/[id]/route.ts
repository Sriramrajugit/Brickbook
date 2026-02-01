import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// PUT /api/users/[id] - Update a user (OWNER only)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user || !user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only OWNER can update users
    if (user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Permission denied. Only Owner can update users.' },
        { status: 403 }
      );
    }

    const userId = parseInt(id);
    const body = await req.json();
    const { name, role, siteId, password } = body;

    // Verify user belongs to same company
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser || targetUser.companyId !== user.companyId) {
      return NextResponse.json(
        { error: 'User not found or unauthorized' },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (role) updateData.role = role;
    if (siteId !== undefined) updateData.siteId = siteId || null;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    updateData.updatedAt = new Date();

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyId: true,
        siteId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (err) {
    console.error('Error updating user:', err);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Deactivate a user (OWNER only)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user || !user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only OWNER can deactivate users
    if (user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Permission denied. Only Owner can deactivate users.' },
        { status: 403 }
      );
    }

    const userId = parseInt(id);

    // Prevent deactivating yourself
    if (userId === user.id) {
      return NextResponse.json(
        { error: 'Cannot deactivate your own account' },
        { status: 400 }
      );
    }

    // Verify user belongs to same company
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser || targetUser.companyId !== user.companyId) {
      return NextResponse.json(
        { error: 'User not found or unauthorized' },
        { status: 404 }
      );
    }

    // Mark user as inactive instead of deleting
    const deactivatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        status: 'Inactive',
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        companyId: true,
        siteId: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ 
      message: 'User deactivated successfully',
      user: deactivatedUser 
    });
  } catch (err) {
    console.error('Error deactivating user:', err);
    return NextResponse.json(
      { error: 'Failed to deactivate user' },
      { status: 500 }
    );
  }
}
