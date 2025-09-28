// src/pages/api/admin/role-builder.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma as db } from "@/lib/prisma";
import { assertPermission, PERMS } from "@/lib/rbac";
import { requireAuth } from "@/lib/auth-helpers";
import { auditAction } from "@/lib/audit";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Require Owner-level permissions for advanced role building
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
    console.error("Role builder error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, user: any) {
  const { action } = req.query;

  switch (action) {
    case "templates":
      return await getTemplates(req, res, user);
    case "bundles":
      return await getPermissionBundles(req, res, user);
    case "roles":
      return await getRolesWithVersions(req, res, user);
    case "review-dashboard":
      return await getReviewDashboard(req, res, user);
    default:
      return await getBuilderDashboard(req, res, user);
  }
}

async function getBuilderDashboard(req: NextApiRequest, res: NextApiResponse, user: any) {
  // Comprehensive role builder dashboard
  const [
    roles,
    templates,
    bundles,
    recentVersions,
    pendingReviews,
    provisioningFlows
  ] = await Promise.all([
    // Get all custom roles with usage stats
    db.rbacRole.findMany({
      where: { orgId: user.orgId, isSystem: false },
      include: {
        userRoles: { select: { userId: true } },
        versions: { 
          where: { isActive: true },
          select: { version: true, changedBy: true, createdAt: true }
        },
        scopes: { where: { isActive: true } },
        reviews: { 
          where: { status: { in: ['pending', 'in_progress'] } },
          select: { id: true, reviewType: true, nextReviewDate: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),

    // Get available templates
    db.roleTemplate.findMany({
      where: { 
        OR: [
          { orgId: user.orgId },
          { isSystemTemplate: true, isPublic: true }
        ]
      },
      orderBy: [{ isSystemTemplate: 'desc' }, { usageCount: 'desc' }],
      take: 10
    }),

    // Get permission bundles
    db.permissionBundle.findMany({
      where: { orgId: user.orgId },
      orderBy: { usageCount: 'desc' },
      take: 10
    }),

    // Recent role versions
    db.roleVersion.findMany({
      where: { orgId: user.orgId },
      include: {
        role: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    }),

    // Pending reviews
    db.roleReview.findMany({
      where: { 
        orgId: user.orgId,
        status: { in: ['pending', 'overdue'] }
      },
      include: {
        role: { select: { name: true } }
      },
      orderBy: { nextReviewDate: 'asc' },
      take: 5
    }),

    // Provisioning flows
    db.provisioningFlow.findMany({
      where: { orgId: user.orgId, isActive: true },
      select: { id: true, name: true, trigger: true, usageCount: true, successRate: true }
    })
  ]);

  // Calculate dashboard metrics
  const stats = {
    totalRoles: roles.length,
    activeRoles: roles.filter(r => r.userRoles.length > 0).length,
    templatesAvailable: templates.length,
    permissionBundles: bundles.length,
    pendingReviews: pendingReviews.length,
    overviewData: {
      rolesWithScoping: roles.filter(r => r.scopes.length > 0).length,
      rolesWithVersioning: roles.filter(r => r.versions.length > 0).length,
      averageUsersPerRole: roles.length > 0 ? 
        roles.reduce((sum, r) => sum + r.userRoles.length, 0) / roles.length : 0
    }
  };

  await auditAction(req, {
    action: 'role_builder_dashboard_view',
    target: 'rbac_role',
    category: 'DATA_ACCESS',
    details: stats
  });

  res.json({
    stats,
    roles: roles.map(role => ({
      id: role.id,
      name: role.name,
      slug: role.slug,
      userCount: role.userRoles.length,
      currentVersion: role.versions[0]?.version || 1,
      hasScoping: role.scopes.length > 0,
      pendingReviews: role.reviews.length,
      lastModified: role.versions[0]?.createdAt || role.createdAt
    })),
    templates: templates.slice(0, 5),
    bundles: bundles.slice(0, 5),
    recentVersions,
    pendingReviews,
    provisioningFlows
  });
}

async function getTemplates(req: NextApiRequest, res: NextApiResponse, user: any) {
  const { industry, category, complexity } = req.query;

  const whereClause: any = {
    OR: [
      { orgId: user.orgId },
      { isSystemTemplate: true, isPublic: true }
    ]
  };

  if (industry) whereClause.industry = industry;
  if (category) whereClause.category = category;
  if (complexity) whereClause.complexity = complexity;

  const templates = await db.roleTemplate.findMany({
    where: whereClause,
    orderBy: [
      { isSystemTemplate: 'desc' },
      { usageCount: 'desc' },
      { createdAt: 'desc' }
    ]
  });

  // Get distinct industries and categories for filtering
  const [industries, categories] = await Promise.all([
    db.roleTemplate.findMany({
      where: { 
        OR: [
          { orgId: user.orgId },
          { isSystemTemplate: true, isPublic: true }
        ],
        industry: { not: null }
      },
      select: { industry: true },
      distinct: ['industry']
    }),
    db.roleTemplate.findMany({
      where: { 
        OR: [
          { orgId: user.orgId },
          { isSystemTemplate: true, isPublic: true }
        ],
        category: { not: null }
      },
      select: { category: true },
      distinct: ['category']
    })
  ]);

  res.json({
    templates,
    filters: {
      industries: industries.map(i => i.industry).filter(Boolean),
      categories: categories.map(c => c.category).filter(Boolean),
      complexities: ['BASIC', 'INTERMEDIATE', 'ADVANCED']
    }
  });
}

async function getPermissionBundles(req: NextApiRequest, res: NextApiResponse, user: any) {
  const { category } = req.query;

  const whereClause: any = { orgId: user.orgId };
  if (category) whereClause.category = category;

  const bundles = await db.permissionBundle.findMany({
    where: whereClause,
    orderBy: { usageCount: 'desc' }
  });

  // Get distinct categories for filtering
  const categories = await db.permissionBundle.findMany({
    where: { orgId: user.orgId, category: { not: null } },
    select: { category: true },
    distinct: ['category']
  });

  res.json({
    bundles,
    categories: categories.map(c => c.category).filter(Boolean)
  });
}

async function getRolesWithVersions(req: NextApiRequest, res: NextApiResponse, user: any) {
  const { roleId } = req.query;

  if (roleId) {
    // Get specific role with full versioning history
    const role = await db.rbacRole.findFirst({
      where: { id: roleId as string, orgId: user.orgId },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          include: {
            role: { select: { name: true } }
          }
        },
        scopes: { 
          where: { isActive: true },
          orderBy: { priority: 'desc' }
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        rolePerms: {
          include: { permission: true }
        },
        userRoles: {
          include: { user: { select: { email: true, name: true } } }
        }
      }
    });

    if (!role) {
      return res.status(404).json({ error: "Role not found" });
    }

    res.json({ role });
  } else {
    // Get all roles with basic version info
    const roles = await db.rbacRole.findMany({
      where: { orgId: user.orgId },
      include: {
        versions: {
          where: { isActive: true },
          select: { version: true, createdAt: true, changedBy: true }
        },
        userRoles: { select: { userId: true } },
        scopes: { where: { isActive: true }, select: { id: true, scopeType: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ roles });
  }
}

async function getReviewDashboard(req: NextApiRequest, res: NextApiResponse, user: any) {
  const [pendingReviews, overdueReviews, upcomingReviews] = await Promise.all([
    // Pending reviews
    db.roleReview.findMany({
      where: { orgId: user.orgId, status: 'pending' },
      include: {
        role: { select: { name: true } }
      },
      orderBy: { nextReviewDate: 'asc' }
    }),

    // Overdue reviews
    db.roleReview.findMany({
      where: { 
        orgId: user.orgId, 
        status: 'overdue',
        nextReviewDate: { lt: new Date() }
      },
      include: {
        role: { select: { name: true } }
      },
      orderBy: { nextReviewDate: 'asc' }
    }),

    // Upcoming reviews (next 30 days)
    db.roleReview.findMany({
      where: {
        orgId: user.orgId,
        nextReviewDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      },
      include: {
        role: { select: { name: true } }
      },
      orderBy: { nextReviewDate: 'asc' }
    })
  ]);

  res.json({
    pendingReviews,
    overdueReviews,
    upcomingReviews,
    stats: {
      totalPending: pendingReviews.length,
      totalOverdue: overdueReviews.length,
      totalUpcoming: upcomingReviews.length
    }
  });
}

async function handlePost(req: NextApiRequest, res: NextApiResponse, user: any) {
  const { action } = req.query;

  switch (action) {
    case "create-from-template":
      return await createRoleFromTemplate(req, res, user);
    case "clone-role":
      return await cloneRole(req, res, user);
    case "create-bundle":
      return await createPermissionBundle(req, res, user);
    case "create-template":
      return await createTemplate(req, res, user);
    case "create-provisioning-flow":
      return await createProvisioningFlow(req, res, user);
    default:
      return await createCustomRole(req, res, user);
  }
}

async function createRoleFromTemplate(req: NextApiRequest, res: NextApiResponse, user: any) {
  const { templateId, roleName, customizations = {} } = req.body;

  if (!templateId || !roleName) {
    return res.status(400).json({ error: "Template ID and role name required" });
  }

  // Get template
  const template = await db.roleTemplate.findFirst({
    where: {
      id: templateId,
      OR: [
        { orgId: user.orgId },
        { isSystemTemplate: true, isPublic: true }
      ]
    }
  });

  if (!template) {
    return res.status(404).json({ error: "Template not found" });
  }

  // Create role from template in transaction
  const result = await db.$transaction(async (tx) => {
    // Create the role
    const role = await tx.rbacRole.create({
      data: {
        orgId: user.orgId,
        name: roleName,
        slug: roleName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''),
        isSystem: false,
      }
    });

    // Create initial version from template
    const version = await tx.roleVersion.create({
      data: {
        roleId: role.id,
        orgId: user.orgId,
        version: 1,
        name: roleName,
        changeReason: `Created from template: ${template.name}`,
        changedBy: user.id,
        isActive: true,
        permissions: template.permissions as any,
        config: { ...(template.config as any), ...customizations },
        scopeConfig: template.scopeConfig as any,
      }
    });

    // Assign permissions to role
    const permissions = template.permissions as string[];
    if (permissions.length > 0) {
      const permissionRecords = await tx.rbacPermission.findMany({
        where: { code: { in: permissions } }
      });

      await tx.rbacRolePermission.createMany({
        data: permissionRecords.map(perm => ({
          roleId: role.id,
          permissionId: perm.id,
        }))
      });
    }

    // Update template usage count
    await tx.roleTemplate.update({
      where: { id: templateId },
      data: { usageCount: { increment: 1 } }
    });

    return { role, version };
  });

  await auditAction(req, {
    action: 'role_create_from_template',
    target: 'rbac_role',
    targetId: result.role.id,
    category: 'AUTHORIZATION',
    details: { 
      templateId, 
      templateName: template.name,
      roleName,
      permissionCount: (template.permissions as string[]).length
    }
  });

  res.status(201).json({ 
    role: result.role,
    version: result.version
  });
}

async function cloneRole(req: NextApiRequest, res: NextApiResponse, user: any) {
  const { sourceRoleId, newRoleName, includeScoping = true } = req.body;

  if (!sourceRoleId || !newRoleName) {
    return res.status(400).json({ error: "Source role ID and new role name required" });
  }

  // Get source role with all its configuration
  const sourceRole = await db.rbacRole.findFirst({
    where: { id: sourceRoleId, orgId: user.orgId },
    include: {
      rolePerms: { include: { permission: true } },
      versions: { where: { isActive: true } },
      scopes: { where: { isActive: true } }
    }
  });

  if (!sourceRole) {
    return res.status(404).json({ error: "Source role not found" });
  }

  // Clone role in transaction
  const result = await db.$transaction(async (tx) => {
    // Create the cloned role
    const clonedRole = await tx.rbacRole.create({
      data: {
        orgId: user.orgId,
        name: newRoleName,
        slug: newRoleName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''),
        isSystem: false,
      }
    });

    // Create initial version
    const activeVersion = sourceRole.versions[0];
    const version = await tx.roleVersion.create({
      data: {
        roleId: clonedRole.id,
        orgId: user.orgId,
        version: 1,
        name: newRoleName,
        changeReason: `Cloned from role: ${sourceRole.name}`,
        changedBy: user.id,
        isActive: true,
        permissions: activeVersion?.permissions || sourceRole.rolePerms.map(rp => rp.permission.code),
        config: activeVersion?.config || {},
        scopeConfig: activeVersion?.scopeConfig || {},
      }
    });

    // Copy permissions
    if (sourceRole.rolePerms.length > 0) {
      await tx.rbacRolePermission.createMany({
        data: sourceRole.rolePerms.map(rp => ({
          roleId: clonedRole.id,
          permissionId: rp.permissionId,
        }))
      });
    }

    // Copy scoping if requested
    if (includeScoping && sourceRole.scopes.length > 0) {
      await tx.roleScope.createMany({
        data: sourceRole.scopes.map(scope => ({
          roleId: clonedRole.id,
          orgId: user.orgId,
          scopeType: scope.scopeType,
          scopeKey: scope.scopeKey,
          scopeName: scope.scopeName,
          permissions: scope.permissions as any,
          restrictions: scope.restrictions as any,
          startDate: scope.startDate,
          endDate: scope.endDate,
          timeZone: scope.timeZone,
          isActive: scope.isActive,
          priority: scope.priority,
          createdBy: user.id,
        }))
      });
    }

    return { clonedRole, version };
  });

  await auditAction(req, {
    action: 'role_clone',
    target: 'rbac_role',
    targetId: result.clonedRole.id,
    category: 'AUTHORIZATION',
    details: { 
      sourceRoleId,
      sourceRoleName: sourceRole.name,
      newRoleName,
      includeScoping,
      permissionCount: sourceRole.rolePerms.length,
      scopeCount: includeScoping ? sourceRole.scopes.length : 0
    }
  });

  res.status(201).json({ 
    role: result.clonedRole,
    version: result.version
  });
}

async function createCustomRole(req: NextApiRequest, res: NextApiResponse, user: any) {
  const { name, description, permissions = [], bundles = [], scoping = {} } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Role name is required" });
  }

  // Validate permissions and bundles
  const [validPermissions, validBundles] = await Promise.all([
    db.rbacPermission.findMany({
      where: { code: { in: permissions } }
    }),
    bundles.length > 0 ? db.permissionBundle.findMany({
      where: { id: { in: bundles }, orgId: user.orgId }
    }) : []
  ]);

  // Combine permissions from bundles
  const bundlePermissions = validBundles.reduce((acc, bundle) => {
    const bundlePerms = bundle.permissions as string[];
    return [...acc, ...bundlePerms];
  }, [] as string[]);

  const allPermissions = [...new Set([...permissions, ...bundlePermissions])];

  // Create role with versioning in transaction
  const result = await db.$transaction(async (tx) => {
    // Create the role
    const role = await tx.rbacRole.create({
      data: {
        orgId: user.orgId,
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''),
        isSystem: false,
      }
    });

    // Create initial version
    const version = await tx.roleVersion.create({
      data: {
        roleId: role.id,
        orgId: user.orgId,
        version: 1,
        name,
        description,
        changeReason: 'Initial role creation',
        changedBy: user.id,
        isActive: true,
        permissions: allPermissions,
        config: {},
        scopeConfig: scoping,
      }
    });

    // Assign permissions to role
    if (validPermissions.length > 0) {
      await tx.rbacRolePermission.createMany({
        data: validPermissions.map(perm => ({
          roleId: role.id,
          permissionId: perm.id,
        }))
      });
    }

    // Create scoping rules if provided
    if (scoping.rules && Array.isArray(scoping.rules)) {
      await tx.roleScope.createMany({
        data: scoping.rules.map((rule: any) => ({
          roleId: role.id,
          orgId: user.orgId,
          scopeType: rule.scopeType,
          scopeKey: rule.scopeKey,
          scopeName: rule.scopeName,
          permissions: rule.permissions || allPermissions,
          restrictions: rule.restrictions || {},
          startDate: rule.startDate ? new Date(rule.startDate) : null,
          endDate: rule.endDate ? new Date(rule.endDate) : null,
          timeZone: rule.timeZone,
          priority: rule.priority || 0,
          createdBy: user.id,
        }))
      });
    }

    // Update bundle usage counts
    if (validBundles.length > 0) {
      await Promise.all(validBundles.map(bundle =>
        tx.permissionBundle.update({
          where: { id: bundle.id },
          data: { usageCount: { increment: 1 } }
        })
      ));
    }

    return { role, version };
  });

  await auditAction(req, {
    action: 'role_create_custom',
    target: 'rbac_role',
    targetId: result.role.id,
    category: 'AUTHORIZATION',
    details: { 
      name,
      permissionCount: allPermissions.length,
      bundleCount: validBundles.length,
      hasScoping: !!(scoping.rules && scoping.rules.length > 0)
    }
  });

  res.status(201).json({ 
    role: result.role,
    version: result.version
  });
}

async function createPermissionBundle(req: NextApiRequest, res: NextApiResponse, user: any) {
  const { name, description, permissions = [], category } = req.body;

  if (!name || permissions.length === 0) {
    return res.status(400).json({ error: "Bundle name and permissions required" });
  }

  // Validate permissions exist
  const validPermissions = await db.rbacPermission.findMany({
    where: { code: { in: permissions } }
  });

  if (validPermissions.length !== permissions.length) {
    return res.status(400).json({ 
      error: "Some permissions are invalid",
      invalid: permissions.filter((p: string) => !validPermissions.find(vp => vp.code === p))
    });
  }

  const bundle = await db.permissionBundle.create({
    data: {
      orgId: user.orgId,
      name,
      description,
      category,
      permissions,
      usageCount: 0,
      createdBy: user.id
    }
  });

  await auditAction(req, {
    action: 'permission_bundle_create',
    target: 'permission_bundle',
    targetId: bundle.id,
    category: 'AUTHORIZATION',
    details: { name, permissionCount: permissions.length, category }
  });

  res.status(201).json({ bundle });
}

async function createTemplate(req: NextApiRequest, res: NextApiResponse, user: any) {
  const { 
    name, 
    description, 
    industry, 
    category, 
    complexity = 'INTERMEDIATE',
    permissions = [],
    config = {},
    scopeConfig = {},
    isPublic = false
  } = req.body;

  if (!name || permissions.length === 0) {
    return res.status(400).json({ error: "Template name and permissions required" });
  }

  // Validate permissions
  const validPermissions = await db.rbacPermission.findMany({
    where: { code: { in: permissions } }
  });

  const template = await db.roleTemplate.create({
    data: {
      orgId: user.orgId,
      name,
      description,
      industry,
      category,
      complexity,
      permissions,
      config,
      scopeConfig,
      isPublic,
      isSystemTemplate: false,
      usageCount: 0,
      createdBy: user.id
    }
  });

  await auditAction(req, {
    action: 'role_template_create',
    target: 'role_template',
    targetId: template.id,
    category: 'AUTHORIZATION',
    details: { name, industry, category, complexity, permissionCount: permissions.length }
  });

  res.status(201).json({ template });
}

async function createProvisioningFlow(req: NextApiRequest, res: NextApiResponse, user: any) {
  const {
    name,
    description,
    trigger = 'MANUAL',
    flowConfig = {},
    scimConfig = {},
    ssoConfig = {},
    isActive = true
  } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Flow name is required" });
  }

  const flow = await db.provisioningFlow.create({
    data: {
      orgId: user.orgId,
      name,
      description,
      trigger,
      // flowConfig, // Field doesn't exist in ProvisioningFlow model
      // scimConfig, // Field doesn't exist in ProvisioningFlow model
      // ssoConfig, // Field doesn't exist in ProvisioningFlow model
      isActive,
      usageCount: 0,
      successRate: 0,
      createdBy: user.id
    }
  });

  await auditAction(req, {
    action: 'provisioning_flow_create',
    target: 'provisioning_flow',
    targetId: flow.id,
    category: 'AUTHORIZATION',
    details: { name, trigger, isActive }
  });

  res.status(201).json({ flow });
}

async function updateRoleScoping(req: NextApiRequest, res: NextApiResponse, user: any) {
  const { roleId, scopes = [] } = req.body;

  if (!roleId) {
    return res.status(400).json({ error: "Role ID required" });
  }

  // Verify role ownership
  const role = await db.rbacRole.findFirst({
    where: { id: roleId, orgId: user.orgId }
  });

  if (!role) {
    return res.status(404).json({ error: "Role not found" });
  }

  // Update scoping in transaction
  const result = await db.$transaction(async (tx) => {
    // Deactivate existing scopes
    await tx.roleScope.updateMany({
      where: { roleId, isActive: true },
      data: { isActive: false }
    });

    // Create new scopes
    const newScopes = await Promise.all(
      scopes.map((scope: any) => 
        tx.roleScope.create({
          data: {
            roleId,
            orgId: user.orgId,
            scopeType: scope.scopeType,
            scopeKey: scope.scopeKey,
            scopeName: scope.scopeName,
            permissions: scope.permissions || [],
            restrictions: scope.restrictions || {},
            startDate: scope.startDate ? new Date(scope.startDate) : null,
            endDate: scope.endDate ? new Date(scope.endDate) : null,
            timeZone: scope.timeZone,
            priority: scope.priority || 0,
            createdBy: user.id,
          }
        })
      )
    );

    return newScopes;
  });

  await auditAction(req, {
    action: 'role_scoping_update',
    target: 'rbac_role',
    targetId: roleId,
    category: 'AUTHORIZATION',
    details: { roleName: role.name, scopeCount: scopes.length }
  });

  res.json({ success: true, scopes: result });
}

async function approveRoleReview(req: NextApiRequest, res: NextApiResponse, user: any) {
  const { reviewId, decision, notes, nextReviewDate } = req.body;

  if (!reviewId || !decision) {
    return res.status(400).json({ error: "Review ID and decision required" });
  }

  // Get the review
  const review = await db.roleReview.findFirst({
    where: { id: reviewId, orgId: user.orgId },
    include: { role: true }
  });

  if (!review) {
    return res.status(404).json({ error: "Review not found" });
  }

  // Update review status
  const updatedReview = await db.roleReview.update({
    where: { id: reviewId },
    data: {
      status: decision === 'approve' ? 'approved' : 'rejected',
      reviewerId: user.id,
      // reviewedAt: new Date(), // Field doesn't exist in RoleReview model
      // reviewNotes: notes, // Field doesn't exist in RoleReview model
      nextReviewDate: nextReviewDate ? new Date(nextReviewDate) : null
    }
  });

  await auditAction(req, {
    action: 'role_review_complete',
    target: 'rbac_role',
    targetId: review.roleId || undefined,
    category: 'AUTHORIZATION',
    severity: decision === 'reject' ? 'WARNING' : 'INFO',
    details: { 
      reviewId,
      roleName: review.role?.name || 'Unknown Role',
      decision,
      reviewType: review.reviewType
    }
  });

  res.json({ review: updatedReview });
}

async function handlePut(req: NextApiRequest, res: NextApiResponse, user: any) {
  const { action } = req.query;

  switch (action) {
    case "rollback":
      return await rollbackToVersion(req, res, user);
    case "update-scoping":
      return await updateRoleScoping(req, res, user);
    case "approve-review":
      return await approveRoleReview(req, res, user);
    default:
      return res.status(400).json({ error: "Invalid action" });
  }
}

async function rollbackToVersion(req: NextApiRequest, res: NextApiResponse, user: any) {
  const { roleId, targetVersion, reason } = req.body;

  if (!roleId || !targetVersion) {
    return res.status(400).json({ error: "Role ID and target version required" });
  }

  // Get target version
  const targetVersionData = await db.roleVersion.findFirst({
    where: {
      roleId,
      version: targetVersion,
      orgId: user.orgId
    }
  });

  if (!targetVersionData) {
    return res.status(404).json({ error: "Target version not found" });
  }

  // Rollback in transaction
  const result = await db.$transaction(async (tx) => {
    // Deactivate current version
    await tx.roleVersion.updateMany({
      where: { roleId, isActive: true },
      data: { isActive: false }
    });

    // Get next version number
    const maxVersion = await tx.roleVersion.findFirst({
      where: { roleId },
      orderBy: { version: 'desc' },
      select: { version: true }
    });

    const nextVersion = (maxVersion?.version || 0) + 1;

    // Create new version as rollback
    const newVersion = await tx.roleVersion.create({
      data: {
        roleId,
        orgId: user.orgId,
        version: nextVersion,
        name: targetVersionData.name,
        description: targetVersionData.description,
        changeReason: reason || `Rollback to version ${targetVersion}`,
        changedBy: user.id,
        isActive: true,
        permissions: targetVersionData.permissions as any,
        config: targetVersionData.config as any,
        scopeConfig: targetVersionData.scopeConfig as any,
      }
    });

    // Update role permissions to match target version
    await tx.rbacRolePermission.deleteMany({
      where: { roleId }
    });

    const permissions = targetVersionData.permissions as string[];
    if (permissions.length > 0) {
      const permissionRecords = await tx.rbacPermission.findMany({
        where: { code: { in: permissions } }
      });

      await tx.rbacRolePermission.createMany({
        data: permissionRecords.map(perm => ({
          roleId,
          permissionId: perm.id,
        }))
      });
    }

    return newVersion;
  });

  await auditAction(req, {
    action: 'role_rollback',
    target: 'rbac_role',
    targetId: roleId,
    category: 'AUTHORIZATION',
    severity: 'WARNING',
    details: { 
      targetVersion,
      newVersion: result.version,
      reason,
      permissionCount: (targetVersionData.permissions as string[]).length
    }
  });

  res.json({ 
    success: true,
    newVersion: result
  });
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse, user: any) {
  const { roleId } = req.query;

  if (!roleId) {
    return res.status(400).json({ error: "Role ID required" });
  }

  // Get role to verify ownership and check if it can be deleted
  const role = await db.rbacRole.findFirst({
    where: { id: roleId as string, orgId: user.orgId, isSystem: false },
    include: {
      userRoles: true,
      versions: true,
      scopes: true,
      reviews: true
    }
  });

  if (!role) {
    return res.status(404).json({ error: "Role not found or cannot be deleted" });
  }

  if (role.userRoles.length > 0) {
    return res.status(400).json({ 
      error: `Cannot delete role assigned to ${role.userRoles.length} user(s)` 
    });
  }

  // Delete role and all related data in transaction
  await db.$transaction(async (tx) => {
    // Delete in order due to foreign key constraints
    await tx.roleReview.deleteMany({ where: { roleId: roleId as string } });
    await tx.roleScope.deleteMany({ where: { roleId: roleId as string } });
    await tx.roleVersion.deleteMany({ where: { roleId: roleId as string } });
    await tx.rbacRolePermission.deleteMany({ where: { roleId: roleId as string } });
    await tx.rbacRole.delete({ where: { id: roleId as string } });
  });

  await auditAction(req, {
    action: 'role_delete',
    target: 'rbac_role',
    targetId: roleId as string,
    category: 'AUTHORIZATION',
    severity: 'WARNING',
    details: { 
      roleName: role.name,
      versionCount: role.versions.length,
      scopeCount: role.scopes.length
    }
  });

  res.json({ success: true });
}