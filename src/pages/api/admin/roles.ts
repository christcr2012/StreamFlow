// src/pages/api/admin/roles.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma as db } from "@/lib/prisma";
import { assertPermission, PERMS } from "@/lib/rbac";
import { requireAuth } from "@/lib/auth-helpers";
import { auditAction } from "@/lib/audit";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Require Owner-level permissions for role management
  const user = await requireAuth(req, res);
  if (!user) return;

  if (!(await assertPermission(req, res, PERMS.ROLE_CREATE))) return;

  try {
    switch (req.method) {
      case "GET":
        return await handleGet(req, res, user);
      case "POST":
        return await handlePost(req, res, user);
      case "PUT":
        return await handlePut(req, res, user);
      case "DELETE":
        return await handleDelete(req, res, user);
      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Roles management error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, user: any) {
  const { includeSystem, includePermissions } = req.query;
  
  const whereClause: any = {
    orgId: user.orgId,
  };

  // Option to exclude system roles
  if (includeSystem !== 'true') {
    whereClause.isSystem = false;
  }

  const roles = await db.rbacRole.findMany({
    where: whereClause,
    include: {
      rolePerms: includePermissions === 'true' ? {
        include: {
          permission: true,
        },
      } : false,
      userRoles: {
        select: {
          userId: true,
        },
      },
    },
    orderBy: [
      { isSystem: 'desc' }, // System roles first
      { createdAt: 'desc' },
    ],
  });

  // Transform the data to include permission codes and user counts
  const transformedRoles = roles.map(role => ({
    id: role.id,
    name: role.name,
    slug: role.slug,
    isSystem: role.isSystem,
    createdAt: role.createdAt,
    permissions: includePermissions === 'true'
      ? role.rolePerms.map(rp => (rp as any).permission?.code || rp.permissionId)
      : [],
    userCount: role.userRoles.length,
  }));

  await auditAction(req, {
    action: 'roles_read',
    target: 'rbac_role',
    category: 'DATA_ACCESS',
    details: { count: roles.length },
  });

  res.json({ roles: transformedRoles });
}

async function handlePost(req: NextApiRequest, res: NextApiResponse, user: any) {
  const { name, description, permissions = [] } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Role name is required" });
  }

  // Generate slug from name
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

  // Check if role already exists
  const existing = await db.rbacRole.findFirst({
    where: {
      orgId: user.orgId,
      slug,
    },
  });

  if (existing) {
    return res.status(409).json({ error: "Role with this name already exists" });
  }

  // Validate permissions exist
  const validPermissions = await db.rbacPermission.findMany({
    where: {
      code: { in: permissions },
    },
  });

  if (validPermissions.length !== permissions.length) {
    const invalid = permissions.filter((p: string) => !validPermissions.find(vp => vp.code === p));
    return res.status(400).json({ error: `Invalid permissions: ${invalid.join(', ')}` });
  }

  // Create role in transaction
  const result = await db.$transaction(async (tx) => {
    // Create the role
    const role = await tx.rbacRole.create({
      data: {
        orgId: user.orgId,
        name,
        slug,
        isSystem: false,
      },
    });

    // Add permissions to role
    if (permissions.length > 0) {
      await tx.rbacRolePermission.createMany({
        data: validPermissions.map(permission => ({
          roleId: role.id,
          permissionId: permission.id,
        })),
      });
    }

    return role;
  });

  await auditAction(req, {
    action: 'role_create',
    target: 'rbac_role',
    targetId: result.id,
    category: 'AUTHORIZATION',
    details: { name, slug, permissions },
  });

  res.status(201).json({ 
    role: {
      id: result.id,
      name: result.name,
      slug: result.slug,
      isSystem: result.isSystem,
      permissions,
      createdAt: result.createdAt,
    }
  });
}

async function handlePut(req: NextApiRequest, res: NextApiResponse, user: any) {
  const { id } = req.query;
  const { name, description, permissions } = req.body;

  if (!id) {
    return res.status(400).json({ error: "Role ID required" });
  }

  // Get existing role
  const existingRole = await db.rbacRole.findFirst({
    where: {
      id: id as string,
      orgId: user.orgId,
      isSystem: false, // Cannot edit system roles
    },
    include: {
      rolePerms: {
        include: {
          permission: true,
        },
      },
    },
  });

  if (!existingRole) {
    return res.status(404).json({ error: "Role not found or cannot be edited" });
  }

  // If updating permissions, validate them
  let validPermissions: any[] = [];
  if (permissions) {
    validPermissions = await db.rbacPermission.findMany({
      where: {
        code: { in: permissions },
      },
    });

    if (validPermissions.length !== permissions.length) {
      const invalid = permissions.filter((p: string) => !validPermissions.find(vp => vp.code === p));
      return res.status(400).json({ error: `Invalid permissions: ${invalid.join(', ')}` });
    }
  }

  // Update role in transaction
  const result = await db.$transaction(async (tx) => {
    // Update role details
    const updatedRole = await tx.rbacRole.update({
      where: { id: id as string },
      data: {
        ...(name && { name }),
        ...(name && { slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') }),
      },
    });

    // Update permissions if provided
    if (permissions) {
      // Remove existing permissions
      await tx.rbacRolePermission.deleteMany({
        where: { roleId: id as string },
      });

      // Add new permissions
      if (validPermissions.length > 0) {
        await tx.rbacRolePermission.createMany({
          data: validPermissions.map(permission => ({
            roleId: id as string,
            permissionId: permission.id,
          })),
        });
      }
    }

    return updatedRole;
  });

  await auditAction(req, {
    action: 'role_update',
    target: 'rbac_role',
    targetId: result.id,
    category: 'AUTHORIZATION',
    details: { 
      changes: { name, permissions },
      previousPermissions: existingRole.rolePerms.map(rp => rp.permission.code),
    },
  });

  res.json({ 
    role: {
      id: result.id,
      name: result.name,
      slug: result.slug,
      isSystem: result.isSystem,
      permissions: permissions || existingRole.rolePerms.map(rp => rp.permission.code),
      createdAt: result.createdAt,
    }
  });
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse, user: any) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "Role ID required" });
  }

  // Get role to verify it exists and is not system role
  const role = await db.rbacRole.findFirst({
    where: {
      id: id as string,
      orgId: user.orgId,
      isSystem: false, // Cannot delete system roles
    },
    include: {
      userRoles: true,
    },
  });

  if (!role) {
    return res.status(404).json({ error: "Role not found or cannot be deleted" });
  }

  // Check if role is assigned to users
  if (role.userRoles.length > 0) {
    return res.status(400).json({ 
      error: `Cannot delete role assigned to ${role.userRoles.length} user(s)` 
    });
  }

  // Delete role (cascade will handle permissions)
  await db.rbacRole.delete({
    where: { id: id as string },
  });

  await auditAction(req, {
    action: 'role_delete',
    target: 'rbac_role',
    targetId: role.id,
    category: 'AUTHORIZATION',
    details: { name: role.name, slug: role.slug },
  });

  res.json({ success: true });
}