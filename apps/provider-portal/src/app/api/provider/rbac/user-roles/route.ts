import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client-provider';

const prisma = new PrismaClient();

// POST /api/provider/rbac/user-roles - Assign a role to a user
export async function POST(request: NextRequest) {
  try {
    // Get provider email from cookie
    const cookie = request.cookies.get('rs_provider')?.value;
    
    if (!cookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = decodeURIComponent(cookie);
    const { userId, roleId } = await request.json();

    if (!userId || !roleId) {
      return NextResponse.json({ error: 'userId and roleId are required' }, { status: 400 });
    }

    // Get provider's org
    const provider = await prisma.user.findUnique({
      where: { email },
      select: { orgId: true },
    });

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    // Verify user belongs to same org
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { orgId: true },
    });

    if (!targetUser || targetUser.orgId !== provider.orgId) {
      return NextResponse.json({ error: 'User not found or not in same org' }, { status: 404 });
    }

    // Verify role exists and belongs to same org (or is system role)
    const role = await prisma.rbacRole.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    if (role.orgId && role.orgId !== provider.orgId) {
      return NextResponse.json({ error: 'Role not found or not in same org' }, { status: 404 });
    }

    // Check if assignment already exists
    const existing = await prisma.rbacUserRole.findUnique({
      where: {
        userId_roleId_orgId: {
          userId,
          roleId,
          orgId: provider.orgId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'User already has this role' }, { status: 400 });
    }

    // Create assignment
    const userRole = await prisma.rbacUserRole.create({
      data: {
        userId,
        roleId,
        orgId: provider.orgId,
      },
    });

    return NextResponse.json({ success: true, userRole });
  } catch (error) {
    console.error('Error assigning role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/provider/rbac/user-roles - Remove a role from a user
export async function DELETE(request: NextRequest) {
  try {
    // Get provider email from cookie
    const cookie = request.cookies.get('rs_provider')?.value;
    
    if (!cookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = decodeURIComponent(cookie);
    const { userId, roleId } = await request.json();

    if (!userId || !roleId) {
      return NextResponse.json({ error: 'userId and roleId are required' }, { status: 400 });
    }

    // Get provider's org
    const provider = await prisma.user.findUnique({
      where: { email },
      select: { orgId: true },
    });

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    // Find and delete the assignment
    const userRole = await prisma.rbacUserRole.findFirst({
      where: {
        userId,
        roleId,
        orgId: provider.orgId,
      },
    });

    if (!userRole) {
      return NextResponse.json({ error: 'Role assignment not found' }, { status: 404 });
    }

    await prisma.rbacUserRole.delete({
      where: { id: userRole.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

