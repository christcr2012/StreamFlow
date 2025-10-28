// apps/tenant-app/src/app/api/permissions/route.ts
// RBAC & Permissions API - Phase 2 (Prisma-backed)

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    if (type === 'permissions') {
      // List all available permissions (system-wide)
      const permissions = await prisma.rbacPermission.findMany({
        orderBy: { code: 'asc' },
      });
      return NextResponse.json({ permissions });
    }

    if (type === 'users') {
      // Users with their roles within this org
      const users = await prisma.user.findMany({
        where: { orgId: auth.orgId },
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          lastSuccessfulLogin: true,
          RbacUserRole: {
            where: { orgId: auth.orgId },
            select: {
              RbacRole: { select: { id: true, name: true, slug: true, isSystem: true } },
            },
          },
        },
        orderBy: { name: 'asc' },
      });

      const shaped = users.map((u) => ({
        id: u.id,
        name: u.name || u.email,
        email: u.email,
        active: u.isActive,
        lastLogin: u.lastSuccessfulLogin?.toISOString() || null,
        roles: u.RbacUserRole.map((ur) => ur.RbacRole),
      }));

      return NextResponse.json({ users: shaped, total: shaped.length });
    }

    // Default: roles + permissions + user counts (org-specific and system roles)
    const roles = await prisma.rbacRole.findMany({
      where: { OR: [{ orgId: auth.orgId }, { orgId: null }] },
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
      include: {
        RbacRolePermission: { include: { RbacPermission: true } },
        RbacUserRole: true,
      },
    });

    const shapedRoles = roles.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      isSystem: r.isSystem,
      userCount: r.RbacUserRole.length,
      permissions: r.RbacRolePermission.map((rp) => rp.RbacPermission.code),
      createdAt: r.createdAt.toISOString(),
    }));

    return NextResponse.json({ roles: shapedRoles, total: shapedRoles.length });
  } catch (error) {
    console.error('GET /api/permissions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permissions data' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body as { action?: string };

    if (action === 'create_role') {
      const name: string = body.name;
      const description: string | undefined = body.description;
      const permissions: string[] = Array.isArray(body.permissions) ? body.permissions : [];
      const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 40);

      // Create role
      const role = await prisma.rbacRole.create({
        data: {
          orgId: auth.orgId,
          name,
          slug,
          isSystem: false,
        },
      });

      // Attach permissions by code
      if (permissions.length > 0) {
        const perms = await prisma.rbacPermission.findMany({ where: { code: { in: permissions } } });
        await prisma.rbacRolePermission.createMany({
          data: perms.map((p) => ({ roleId: role.id, permissionId: p.id })),
          skipDuplicates: true,
        });
      }

      return NextResponse.json({ id: role.id, name: role.name, slug: role.slug, isSystem: role.isSystem, permissions }, { status: 201 });
    }

    if (action === 'assign_role') {
      const userId: string = body.userId;
      const roleId: string = body.roleId;

      // Validate user and role belong to this org context (role can be system-wide)
      const [user, role] = await Promise.all([
        prisma.user.findFirst({ where: { id: userId, orgId: auth.orgId }, select: { id: true } }),
        prisma.rbacRole.findFirst({ where: { id: roleId, OR: [{ orgId: auth.orgId }, { orgId: null }] }, select: { id: true } }),
      ]);

      if (!user || !role) {
        return NextResponse.json({ error: 'Invalid user or role for this organization' }, { status: 400 });
      }

      // Upsert assignment
      await prisma.rbacUserRole.upsert({
        where: { userId_roleId_orgId: { userId, roleId, orgId: auth.orgId } },
        update: {},
        create: { userId, roleId, orgId: auth.orgId },
      });

      return NextResponse.json({ userId, roleId, orgId: auth.orgId });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('POST /api/permissions error:', error);
    return NextResponse.json(
      { error: 'Failed to process permissions action' },
      { status: 500 }
    );
  }
}
