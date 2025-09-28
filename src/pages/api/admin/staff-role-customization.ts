// src/pages/api/admin/staff-role-customization.ts
// Owner-controlled Staff Role Customization Engine for Robinson Solutions B2B SaaS

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma as db } from "@/lib/prisma";
import { assertPermission, PERMS } from "@/lib/rbac";
import { requireAuth } from "@/lib/auth-helpers";
import { auditAction } from "@/lib/audit";
import { STAFF_ROLE_TEMPLATE, STAFF_ROLE_VARIANTS, StaffRoleCapabilities, StaffRoleConstraints } from "@/lib/roles/staff-role-template";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Require Owner-level permissions for Staff role customization
  const user = await requireAuth(req, res);
  if (!user) return;

  // Owner or Role Admin can customize Staff roles
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
    console.error("Staff role customization error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, user: any) {
  const { action } = req.query;

  switch (action) {
    case "template":
      return await getStaffTemplate(req, res, user);
    case "variants":
      return await getStaffVariants(req, res, user);
    case "current-config":
      return await getCurrentStaffConfig(req, res, user);
    case "customization-options":
      return await getCustomizationOptions(req, res, user);
    default:
      return await getStaffRoleOverview(req, res, user);
  }
}

async function getStaffTemplate(req: NextApiRequest, res: NextApiResponse, user: any) {
  // Return the base Staff role template with all options
  const template = {
    ...STAFF_ROLE_TEMPLATE,
    variants: Object.keys(STAFF_ROLE_VARIANTS),
    customizationCapabilities: {
      canExpand: true,
      canLimit: true,
      canRename: true,
      canClone: true,
      canCreateVariants: true
    }
  };

  await auditAction(req, {
    action: 'staff_template_view',
    target: 'role_template',
    category: 'DATA_ACCESS',
    details: { templateName: template.name }
  });

  res.json({ template });
}

async function getStaffVariants(req: NextApiRequest, res: NextApiResponse, user: any) {
  // Get available Staff role variants
  const variants = Object.entries(STAFF_ROLE_VARIANTS).map(([key, variant]) => ({
    id: key,
    ...variant,
    usageStats: {
      // These would be calculated from actual usage
      activeUsers: 0,
      lastUsed: null,
      popularity: 0
    }
  }));

  res.json({ variants });
}

async function getCurrentStaffConfig(req: NextApiRequest, res: NextApiResponse, user: any) {
  // Get current Staff role configuration for this organization
  const staffRole = await db.rbacRole.findFirst({
    where: { 
      orgId: user.orgId, 
      slug: 'staff' 
    },
    include: {
      rolePerms: { include: { permission: true } },
      userRoles: { include: { user: { select: { email: true, name: true } } } },
      versions: { 
        where: { isActive: true },
        include: { role: { select: { name: true } } }
      },
      scopes: { where: { isActive: true } }
    }
  });

  if (!staffRole) {
    return res.status(404).json({ 
      error: "Staff role not found", 
      suggestion: "Create a Staff role first using the template" 
    });
  }

  // Analyze current configuration vs template
  const templatePermissions = STAFF_ROLE_TEMPLATE.basePermissions;
  const currentPermissions = staffRole.rolePerms.map(rp => rp.permission.code);
  
  const analysis = {
    permissionDifferences: {
      added: currentPermissions.filter(p => !templatePermissions.includes(p)),
      removed: templatePermissions.filter(p => !currentPermissions.includes(p)),
      total: currentPermissions.length,
      templateTotal: templatePermissions.length
    },
    scopingConfiguration: staffRole.scopes.map(scope => ({
      type: scope.scopeType,
      key: scope.scopeKey,
      name: scope.scopeName,
      restrictions: scope.restrictions
    })),
    currentVersion: staffRole.versions[0]?.version || 1,
    userCount: staffRole.userRoles.length,
    lastModified: staffRole.versions[0]?.createdAt || staffRole.createdAt
  };

  res.json({ 
    currentConfig: staffRole,
    analysis,
    customizationRecommendations: generateStrategicRecommendations(analysis, [])
  });
}

async function getCustomizationOptions(req: NextApiRequest, res: NextApiResponse, user: any) {
  // Return comprehensive customization options for Staff role
  const options = {
    capabilities: STAFF_ROLE_TEMPLATE.customizationOptions.capabilities,
    constraints: STAFF_ROLE_TEMPLATE.customizationOptions.constraints,
    
    // Available permission expansions
    availableExpansions: {
      customerAccess: [
        { code: "customer:read_department", description: "View all customers in department" },
        { code: "customer:read_all", description: "View all organization customers" },
        { code: "customer:create", description: "Create new customers" },
        { code: "customer:edit_all", description: "Edit any customer record" }
      ],
      taskManagement: [
        { code: "task:create", description: "Create new tasks" },
        { code: "task:assign_others", description: "Assign tasks to other staff" },
        { code: "task:delete", description: "Delete tasks (with approval)" },
        { code: "task:bulk_operations", description: "Perform bulk task operations" }
      ],
      analytics: [
        { code: "analytics:view_personal", description: "View personal performance analytics" },
        { code: "analytics:view_team", description: "View team performance analytics" },
        { code: "analytics:export", description: "Export analytics reports" }
      ],
      aiFeatures: [
        { code: "ai:assistant_basic", description: "Basic AI assistant access" },
        { code: "ai:assistant_advanced", description: "Advanced AI features" },
        { code: "ai:automation_setup", description: "Configure AI automations" }
      ]
    },

    // Constraint options
    constraintOptions: {
      dataVisibility: [
        { value: "assigned_only", label: "Assigned entities only", description: "Staff can only see assigned tasks, customers, etc." },
        { value: "department", label: "Department scope", description: "Staff can see all data within their department" },
        { value: "territory", label: "Territory scope", description: "Staff can see data within assigned territory" },
        { value: "project", label: "Project scope", description: "Staff can see data within assigned projects" }
      ],
      timeRestrictions: [
        { value: "none", label: "No restrictions", description: "24/7 access" },
        { value: "business_hours", label: "Business hours only", description: "Access only during configured business hours" },
        { value: "custom_schedule", label: "Custom schedule", description: "Define specific days and hours" },
        { value: "shift_based", label: "Shift-based", description: "Access only during assigned shifts" }
      ],
      approvalWorkflows: [
        { action: "customer:delete", label: "Customer deletion", required: true },
        { action: "task:delete", label: "Task deletion", required: true },
        { action: "data:bulk_export", label: "Bulk data export", required: true },
        { action: "schedule:override", label: "Schedule override", required: false },
        { action: "overtime:request", label: "Overtime requests", required: false }
      ]
    },

    // Preset configurations for common business types
    industryPresets: {
      cleaning: {
        name: "Cleaning Services",
        description: "Optimized for janitorial and cleaning businesses",
        recommendedExpansions: ["task:create", "customer:read_department", "ai:assistant_basic"],
        recommendedConstraints: {
          dataVisibility: "territory",
          timeRestrictions: "shift_based"
        }
      },
      healthcare: {
        name: "Healthcare Services", 
        description: "HIPAA-compliant configuration for healthcare staff",
        recommendedExpansions: ["analytics:view_personal"],
        recommendedConstraints: {
          dataVisibility: "department",
          timeRestrictions: "business_hours",
          additionalSafeguards: ["hipaa_compliance", "patient_data_encryption"]
        }
      },
      professional: {
        name: "Professional Services",
        description: "Optimized for consulting and professional service firms",
        recommendedExpansions: ["customer:read_all", "analytics:view_team", "ai:assistant_advanced"],
        recommendedConstraints: {
          dataVisibility: "project",
          timeRestrictions: "none"
        }
      }
    }
  };

  res.json({ customizationOptions: options });
}

async function getStaffRoleOverview(req: NextApiRequest, res: NextApiResponse, user: any) {
  // Comprehensive overview of Staff role status and customization opportunities
  const [staffRole, staffUsers, recentActivity] = await Promise.all([
    db.rbacRole.findFirst({
      where: { orgId: user.orgId, slug: 'staff' },
      include: {
        userRoles: true,
        versions: { orderBy: { version: 'desc' }, take: 5 },
        scopes: { where: { isActive: true } }
      }
    }),
    db.rbacUserRole.findMany({
      where: { 
        orgId: user.orgId,
        role: { slug: 'staff' }
      },
      include: { user: { select: { email: true, name: true, status: true } } }
    }),
    // Recent activity would come from audit logs
    db.auditLog.findMany({
      where: { 
        orgId: user.orgId,
        entityType: 'rbac_role',
        action: { contains: 'staff' }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })
  ]);

  const overview = {
    roleExists: !!staffRole,
    userCount: staffUsers?.length || 0,
    activeUsers: staffUsers?.filter(ur => ur.user.status === 'active').length || 0,
    customizationLevel: staffRole ? calculateCustomizationLevel(staffRole) : 'none',
    versionHistory: staffRole?.versions || [],
    scopingRules: staffRole?.scopes?.length || 0,
    recentChanges: recentActivity,
    
    recommendations: {
      immediate: generateImmediateRecommendations(staffRole, staffUsers),
      strategic: generateStrategicRecommendations(staffRole, staffUsers)
    },

    metrics: {
      permissionCount: 0, // TODO: Implement rolePerms relationship
      scopeComplexity: calculateScopeComplexity(staffRole?.scopes || []),
      lastModified: staffRole?.createdAt, // Use createdAt since updatedAt doesn't exist
      complianceScore: calculateComplianceScore(staffRole)
    }
  };

  res.json({ overview });
}

async function handlePost(req: NextApiRequest, res: NextApiResponse, user: any) {
  const { action } = req.query;

  switch (action) {
    case "create-from-template":
      return await createStaffFromTemplate(req, res, user);
    case "clone-variant":
      return await cloneStaffVariant(req, res, user);
    case "apply-preset":
      // TODO: Implement applyIndustryPreset function
      return res.status(501).json({ error: 'Industry preset application not yet implemented' });
    case "request-elevation":
      // TODO: Implement requestTemporaryElevation function
      return res.status(501).json({ error: 'Temporary elevation request not yet implemented' });
    default:
      return res.status(400).json({ error: "Invalid action" });
  }
}

async function createStaffFromTemplate(req: NextApiRequest, res: NextApiResponse, user: any) {
  const { 
    customizations = {}, 
    industryPreset = null,
    roleName = "Staff",
    applyConstraints = true 
  } = req.body;

  // Check if Staff role already exists
  const existingRole = await db.rbacRole.findFirst({
    where: { orgId: user.orgId, slug: 'staff' }
  });

  if (existingRole) {
    return res.status(400).json({ 
      error: "Staff role already exists", 
      suggestion: "Use customization endpoints to modify existing role" 
    });
  }

  // Create Staff role in transaction
  const result = await db.$transaction(async (tx) => {
    // Create the base Staff role
    const role = await tx.rbacRole.create({
      data: {
        orgId: user.orgId,
        name: roleName,
        slug: 'staff',
        isSystem: false,
      }
    });

    // Apply industry preset if specified
    let permissions = [...STAFF_ROLE_TEMPLATE.basePermissions];
    let constraints = { ...STAFF_ROLE_TEMPLATE.defaultConstraints };

    if (industryPreset && STAFF_ROLE_TEMPLATE.customizationOptions) {
      // Apply preset logic here
      // This would expand permissions and modify constraints based on industry
    }

    // Apply custom permissions and constraints
    if (customizations.additionalPermissions) {
      permissions = [...permissions, ...customizations.additionalPermissions];
    }

    // Create initial version
    const version = await tx.roleVersion.create({
      data: {
        roleId: role.id,
        orgId: user.orgId,
        version: 1,
        name: roleName,
        description: `Created from Staff template${industryPreset ? ` with ${industryPreset} preset` : ''}`,
        changeReason: 'Initial Staff role creation from template',
        changedBy: user.id,
        isActive: true,
        permissions,
        config: { 
          capabilities: customizations.capabilities || {},
          industryPreset 
        },
        scopeConfig: customizations.constraints || constraints,
      }
    });

    // Assign permissions to role
    const permissionRecords = await tx.rbacPermission.findMany({
      where: { code: { in: permissions } }
    });

    if (permissionRecords.length > 0) {
      await tx.rbacRolePermission.createMany({
        data: permissionRecords.map(perm => ({
          roleId: role.id,
          permissionId: perm.id,
        }))
      });
    }

    // Create default scoping rules if constraints specified
    if (applyConstraints && customizations.constraints?.dataVisibility) {
      const scopeRules = generateScopeRules(customizations.constraints.dataVisibility, permissions);
      
      if (scopeRules.length > 0) {
        await tx.roleScope.createMany({
          data: scopeRules.map(rule => ({
            roleId: role.id,
            orgId: user.orgId,
            scopeType: rule.scopeType,
            scopeKey: rule.scopeKey,
            scopeName: rule.scopeName,
            permissions: rule.permissions,
            restrictions: rule.restrictions,
            priority: rule.priority || 0,
            createdBy: user.id,
          }))
        });
      }
    }

    return { role, version };
  });

  await auditAction(req, {
    action: 'staff_role_create',
    target: 'rbac_role',
    targetId: result.role.id,
    category: 'AUTHORIZATION',
    details: { 
      roleName,
      industryPreset,
      permissionCount: STAFF_ROLE_TEMPLATE.basePermissions.length,
      hasCustomizations: Object.keys(customizations).length > 0
    }
  });

  res.status(201).json({ 
    role: result.role,
    version: result.version,
    message: "Staff role created successfully from template"
  });
}

async function cloneStaffVariant(req: NextApiRequest, res: NextApiResponse, user: any) {
  const { variant, newRoleName, customizations = {} } = req.body;

  if (!variant || !STAFF_ROLE_VARIANTS[variant as keyof typeof STAFF_ROLE_VARIANTS]) {
    return res.status(400).json({ error: "Invalid Staff role variant" });
  }

  const variantConfig = STAFF_ROLE_VARIANTS[variant as keyof typeof STAFF_ROLE_VARIANTS];
  
  // Create cloned role in transaction
  const result = await db.$transaction(async (tx) => {
    const role = await tx.rbacRole.create({
      data: {
        orgId: user.orgId,
        name: newRoleName || variantConfig.name,
        slug: (newRoleName || variantConfig.name).toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        isSystem: false,
      }
    });

    // Combine base permissions with variant permissions
    const permissions = [
      ...STAFF_ROLE_TEMPLATE.basePermissions,
      ...(variantConfig.additionalPermissions || [])
    ];

    // Create version with variant configuration
    const version = await tx.roleVersion.create({
      data: {
        roleId: role.id,
        orgId: user.orgId,
        version: 1,
        name: newRoleName || variantConfig.name,
        description: `Cloned from Staff variant: ${variant}`,
        changeReason: `Role cloned from ${variant} variant`,
        changedBy: user.id,
        isActive: true,
        permissions,
        config: { 
          baseVariant: variant,
          ...variantConfig,
          ...customizations 
        },
        scopeConfig: {
          ...STAFF_ROLE_TEMPLATE.defaultConstraints,
          ...(variantConfig as any).expandedConstraints || {},
          ...(customizations.constraints || {})
        },
      }
    });

    // Assign permissions
    const permissionRecords = await tx.rbacPermission.findMany({
      where: { code: { in: permissions } }
    });

    if (permissionRecords.length > 0) {
      await tx.rbacRolePermission.createMany({
        data: permissionRecords.map(perm => ({
          roleId: role.id,
          permissionId: perm.id,
        }))
      });
    }

    return { role, version };
  });

  await auditAction(req, {
    action: 'staff_variant_clone',
    target: 'rbac_role',
    targetId: result.role.id,
    category: 'AUTHORIZATION',
    details: { 
      variant,
      newRoleName: newRoleName || variantConfig.name,
      permissionCount: STAFF_ROLE_TEMPLATE.basePermissions.length + (variantConfig.additionalPermissions?.length || 0)
    }
  });

  res.status(201).json({ 
    role: result.role,
    version: result.version,
    variant: variantConfig,
    message: `${variant} variant cloned successfully`
  });
}

// Helper functions
function calculateCustomizationLevel(role: any): 'none' | 'light' | 'moderate' | 'heavy' {
  const basePermissionCount = STAFF_ROLE_TEMPLATE.basePermissions.length;
  const currentPermissionCount = role.rolePerms?.length || 0;
  const scopeCount = role.scopes?.length || 0;
  
  const permissionDifference = Math.abs(currentPermissionCount - basePermissionCount);
  
  if (permissionDifference === 0 && scopeCount === 0) return 'none';
  if (permissionDifference <= 3 && scopeCount <= 2) return 'light';
  if (permissionDifference <= 8 && scopeCount <= 5) return 'moderate';
  return 'heavy';
}

function generateScopeRules(dataVisibility: any, permissions: string[]): any[] {
  const rules = [];
  
  if (dataVisibility.byDepartment) {
    rules.push({
      scopeType: 'DEPARTMENT',
      scopeKey: 'user_department',
      scopeName: 'Department-based access',
      permissions: permissions.filter(p => p.includes('read') || p.includes('update')),
      restrictions: { enforceDataBoundary: true },
      priority: 1
    });
  }
  
  if (dataVisibility.assignedOnly) {
    rules.push({
      scopeType: 'ASSIGNMENT',
      scopeKey: 'assigned_entities',
      scopeName: 'Assigned entities only',
      permissions: permissions,
      restrictions: { strictAssignmentOnly: true },
      priority: 2
    });
  }
  
  return rules;
}

function generateImmediateRecommendations(role: any, users: any[]): string[] {
  const recommendations = [];
  
  if (!role) {
    recommendations.push("Create a Staff role using the template to enable employee access");
  }
  
  if (users && users.length === 0) {
    recommendations.push("Assign the Staff role to employees who need system access");
  }
  
  if (role && !role.scopes?.length) {
    recommendations.push("Consider adding data visibility scoping for better security");
  }
  
  return recommendations;
}

function generateStrategicRecommendations(role: any, users: any[]): string[] {
  const recommendations = [];
  
  if (users && users.length > 10) {
    recommendations.push("Consider creating specialized role variants for different staff functions");
  }
  
  recommendations.push("Set up periodic role reviews to ensure permissions remain appropriate");
  recommendations.push("Enable temporary elevation for occasional privileged tasks");
  
  return recommendations;
}

function calculateScopeComplexity(scopes: any[]): 'simple' | 'moderate' | 'complex' {
  if (scopes.length === 0) return 'simple';
  if (scopes.length <= 3) return 'moderate';
  return 'complex';
}

function calculateComplianceScore(role: any): number {
  // Calculate compliance score based on various factors
  let score = 100;
  
  if (!role) return 0;
  
  // Deduct points for missing safeguards
  if (!role.scopes?.length) score -= 20;
  if (!role.versions?.length) score -= 10;
  
  return Math.max(0, score);
}

// Additional handlers for PUT and DELETE would go here...
async function handlePut(req: NextApiRequest, res: NextApiResponse, user: any) {
  // Handle role modifications, constraint updates, etc.
  res.status(501).json({ error: "Role modification endpoints coming soon" });
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse, user: any) {
  // Handle role deletion with proper safeguards
  res.status(501).json({ error: "Role deletion endpoints coming soon" });
}