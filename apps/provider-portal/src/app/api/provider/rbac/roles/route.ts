import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client-provider';

const prisma = new PrismaClient();

// GET /api/provider/rbac/roles - List all roles with their permissions
export async function GET(request: NextRequest) {
  try {
    // Get provider email from cookie
    const cookie = request.cookies.get('rs_provider')?.value;
    
    if (!cookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = decodeURIComponent(cookie);

    // Get user's org
    const user = await prisma.user.findUnique({
      where: { email },
      select: { orgId: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch all roles for this org (including system roles)
    const roles = await prisma.rbacRole.findMany({
      where: {
        OR: [
          { orgId: user.orgId },
          { isSystem: true },
        ],
      },
      include: {
        rolePerms: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: [
        { isSystem: 'desc' },
        { name: 'asc' },
      ],
    });

    // Transform to include permissions array
    const rolesWithPermissions = roles.map((role) => ({
      id: role.id,
      name: role.name,
      slug: role.slug,
      isSystem: role.isSystem,
      permissions: role.rolePerms.map((rp) => ({
        id: rp.permission.id,
        code: rp.permission.code,
        description: rp.permission.description,
      })),
    }));

    return NextResponse.json({ roles: rolesWithPermissions });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/provider/rbac/roles - Create a new role
export async function POST(request: NextRequest) {
  try {
    // Get provider email from cookie
    const cookie = request.cookies.get('rs_provider')?.value;
    
    if (!cookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = decodeURIComponent(cookie);
    const { name, slug, permissionIds } = await request.json();

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    // Get user's org
    const user = await prisma.user.findUnique({
      where: { email },
      select: { orgId: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if slug already exists for this org
    const existing = await prisma.rbacRole.findUnique({
      where: {
        orgId_slug: {
          orgId: user.orgId,
          slug,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Role with this slug already exists' }, { status: 400 });
    }

    // Create role
    const role = await prisma.rbacRole.create({
      data: {
        name,
        slug,
        orgId: user.orgId,
        isSystem: false,
        rolePerms: {
          create: (permissionIds || []).map((permId: string) => ({
            permissionId: permId,
          })),
        },
      },
      include: {
        rolePerms: {
          include: {
            permission: true,
          },
        },
      },
    });

    return NextResponse.json({
      role: {
        id: role.id,
        name: role.name,
        slug: role.slug,
        isSystem: role.isSystem,
        permissions: role.rolePerms.map((rp) => ({
          id: rp.permission.id,
          code: rp.permission.code,
          description: rp.permission.description,
        })),
      },
    });
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

