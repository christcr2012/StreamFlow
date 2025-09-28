// src/pages/api/admin/temporary-elevation.ts
// Just-in-time Privilege Elevation System for Robinson Solutions B2B SaaS

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma as db } from "@/lib/prisma";
import { assertPermission, PERMS } from "@/lib/rbac";
import { requireAuth } from "@/lib/auth-helpers";
import { auditAction } from "@/lib/audit";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await requireAuth(req, res);
  if (!user) return;

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
    console.error("Temporary elevation error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, user: any) {
  const { action } = req.query;

  switch (action) {
    case "my-requests":
      return await getMyElevationRequests(req, res, user);
    case "pending-approvals":
      return await getPendingApprovals(req, res, user);
    case "active-elevations":
      return await getActiveElevations(req, res, user);
    case "elevation-history":
      return await getElevationHistory(req, res, user);
    case "available-roles":
      return await getAvailableElevationRoles(req, res, user);
    default:
      return await getElevationOverview(req, res, user);
  }
}

async function getMyElevationRequests(req: NextApiRequest, res: NextApiResponse, user: any) {
  const { status, limit = 20 } = req.query;

  const whereClause: any = {
    orgId: user.orgId,
    userId: user.id
  };

  if (status) {
    whereClause.status = status;
  }

  const requests = await db.temporaryElevation.findMany({
    where: whereClause,
    orderBy: { requestedAt: 'desc' },
    take: parseInt(limit as string),
    include: {
      org: { select: { name: true } },
      user: { select: { email: true, name: true } }
    }
  });

  await auditAction(req, {
    action: 'elevation_requests_view',
    target: 'temporary_elevation',
    category: 'DATA_ACCESS',
    details: { requestCount: requests.length, status }
  });

  res.json({ requests });
}

async function getPendingApprovals(req: NextApiRequest, res: NextApiResponse, user: any) {
  // Only managers/owners can see pending approvals
  if (!(await assertPermission(req, res, PERMS.HR_MANAGE))) return;

  const pendingRequests = await db.temporaryElevation.findMany({
    where: {
      orgId: user.orgId,
      status: 'PENDING',
      approvalRequired: true
    },
    orderBy: [
      { emergencyAccess: 'desc' }, // Emergency requests first
      { requestedAt: 'asc' }       // Oldest first
    ],
    include: {
      user: { 
        select: { 
          email: true, 
          name: true, 
          role: true,
          rbacUserRoles: { 
            include: { role: { select: { name: true } } } 
          }
        } 
      }
    }
  });

  // Categorize requests
  const categorized = {
    emergency: pendingRequests.filter(r => r.emergencyAccess),
    standard: pendingRequests.filter(r => !r.emergencyAccess),
    overdue: pendingRequests.filter(r => 
      new Date(r.requestedAt).getTime() < Date.now() - (2 * 60 * 60 * 1000) // 2 hours old
    )
  };

  res.json({ 
    pendingRequests,
    categorized,
    summary: {
      total: pendingRequests.length,
      emergency: categorized.emergency.length,
      overdue: categorized.overdue.length
    }
  });
}

async function getActiveElevations(req: NextApiRequest, res: NextApiResponse, user: any) {
  // Managers can see all active elevations, staff can see only their own
  const canViewAll = await assertPermission(req, res, PERMS.HR_MANAGE);
  
  const whereClause: any = {
    orgId: user.orgId,
    status: 'ACTIVE',
    expiresAt: { gt: new Date() }
  };

  if (!canViewAll) {
    whereClause.userId = user.id;
  }

  const activeElevations = await db.temporaryElevation.findMany({
    where: whereClause,
    orderBy: { expiresAt: 'asc' }, // Expiring soon first
    include: {
      user: { select: { email: true, name: true } }
    }
  });

  // Calculate remaining time for each elevation
  const enrichedElevations = activeElevations.map(elevation => ({
    ...elevation,
    timeRemaining: elevation.expiresAt ? 
      Math.max(0, Math.floor((elevation.expiresAt.getTime() - Date.now()) / (1000 * 60))) : 0,
    isExpiringSoon: elevation.expiresAt ? 
      elevation.expiresAt.getTime() - Date.now() < (15 * 60 * 1000) : false // 15 minutes
  }));

  res.json({ 
    activeElevations: enrichedElevations,
    expiringSoon: enrichedElevations.filter(e => e.isExpiringSoon)
  });
}

async function getElevationHistory(req: NextApiRequest, res: NextApiResponse, user: any) {
  const { userId, limit = 50, offset = 0 } = req.query;
  
  const canViewAll = await assertPermission(req, res, PERMS.HR_MANAGE);
  
  const whereClause: any = {
    orgId: user.orgId,
    status: { in: ['EXPIRED', 'TERMINATED', 'REJECTED', 'CANCELLED'] }
  };

  if (!canViewAll || !userId) {
    whereClause.userId = userId || user.id;
  } else if (userId) {
    whereClause.userId = userId;
  }

  const [history, totalCount] = await Promise.all([
    db.temporaryElevation.findMany({
      where: whereClause,
      orderBy: { requestedAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      include: {
        user: { select: { email: true, name: true } }
      }
    }),
    db.temporaryElevation.count({ where: whereClause })
  ]);

  // Calculate usage statistics
  const stats = {
    totalRequests: totalCount,
    approvedCount: history.filter(h => ['EXPIRED', 'TERMINATED'].includes(h.status)).length,
    rejectedCount: history.filter(h => h.status === 'REJECTED').length,
    cancelledCount: history.filter(h => h.status === 'CANCELLED').length,
    averageDuration: history
      .filter(h => h.actualDuration)
      .reduce((sum, h) => sum + (h.actualDuration || 0), 0) / 
      Math.max(1, history.filter(h => h.actualDuration).length)
  };

  res.json({ 
    history, 
    stats,
    pagination: {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      totalCount,
      hasMore: parseInt(offset as string) + parseInt(limit as string) < totalCount
    }
  });
}

async function getAvailableElevationRoles(req: NextApiRequest, res: NextApiResponse, user: any) {
  // Get roles that user can request elevation to
  const userRoles = await db.rbacUserRole.findMany({
    where: { userId: user.id, orgId: user.orgId },
    include: { role: true }
  });

  const currentRoleLevel = determineRoleLevel(userRoles.map(ur => ur.role.slug));

  // Get roles with higher privilege levels
  const availableRoles = await db.rbacRole.findMany({
    where: {
      orgId: user.orgId,
      isSystem: false
    },
    include: {
      rolePerms: { include: { permission: true } }
    }
  });

  // Filter roles based on elevation rules
  const eligibleRoles = availableRoles
    .filter(role => {
      const roleLevel = determineRoleLevel([role.slug]);
      return roleLevel > currentRoleLevel && roleLevel <= currentRoleLevel + 2; // Max 2 levels up
    })
    .map(role => ({
      id: role.id,
      name: role.name,
      slug: role.slug,
      permissionCount: role.rolePerms.length,
      description: getElevationDescription(role.slug),
      maxDuration: getMaxElevationDuration(role.slug),
      requiresApproval: requiresApprovalForRole(role.slug),
      riskLevel: calculateRiskLevel(role.rolePerms.map(rp => rp.permission.code))
    }));

  res.json({ 
    availableRoles: eligibleRoles,
    currentLevel: currentRoleLevel,
    elevationRules: {
      maxLevelsUp: 2,
      defaultDuration: 60, // minutes
      maxDuration: 240,    // 4 hours
      emergencyDuration: 30 // 30 minutes for emergency access
    }
  });
}

async function getElevationOverview(req: NextApiRequest, res: NextApiResponse, user: any) {
  const canViewAll = await assertPermission(req, res, PERMS.HR_MANAGE);
  
  const baseWhere = canViewAll ? { orgId: user.orgId } : { orgId: user.orgId, userId: user.id };

  const [
    activeCount,
    pendingCount,
    todaysRequests,
    myActiveElevation
  ] = await Promise.all([
    db.temporaryElevation.count({
      where: { ...baseWhere, status: 'ACTIVE' }
    }),
    db.temporaryElevation.count({
      where: { ...baseWhere, status: 'PENDING' }
    }),
    db.temporaryElevation.count({
      where: {
        ...baseWhere,
        requestedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }
    }),
    db.temporaryElevation.findFirst({
      where: {
        orgId: user.orgId,
        userId: user.id,
        status: 'ACTIVE',
        expiresAt: { gt: new Date() }
      },
      orderBy: { expiresAt: 'asc' }
    })
  ]);

  const overview = {
    counts: {
      active: activeCount,
      pending: pendingCount,
      todaysRequests
    },
    myStatus: {
      hasActiveElevation: !!myActiveElevation,
      activeElevation: myActiveElevation ? {
        id: myActiveElevation.id,
        targetRole: myActiveElevation.targetRole,
        expiresAt: myActiveElevation.expiresAt,
        timeRemaining: myActiveElevation.expiresAt ? 
          Math.max(0, Math.floor((myActiveElevation.expiresAt.getTime() - Date.now()) / (1000 * 60))) : 0
      } : null,
      canRequestElevation: true // TODO: Add business logic
    },
    permissions: {
      canApprove: canViewAll,
      canViewAll,
      canRequestEmergency: true // TODO: Add business logic
    }
  };

  res.json({ overview });
}

async function handlePost(req: NextApiRequest, res: NextApiResponse, user: any) {
  const { action } = req.query;

  switch (action) {
    case "request":
      return await requestElevation(req, res, user);
    case "approve":
      return await approveElevation(req, res, user);
    case "reject":
      // TODO: Implement rejectElevation function
      return res.status(501).json({ error: 'Elevation rejection not yet implemented' });
    case "emergency":
      // TODO: Implement requestEmergencyElevation function
      return res.status(501).json({ error: 'Emergency elevation not yet implemented' });
    default:
      return res.status(400).json({ error: "Invalid action" });
  }
}

async function requestElevation(req: NextApiRequest, res: NextApiResponse, user: any) {
  const { 
    targetRole, 
    reason, 
    requestedDuration = 60, 
    emergencyAccess = false 
  } = req.body;

  if (!targetRole || !reason) {
    return res.status(400).json({ error: "Target role and reason are required" });
  }

  // Validate duration limits
  const maxDuration = emergencyAccess ? 30 : 240; // Emergency: 30min, Regular: 4hrs
  if (requestedDuration > maxDuration) {
    return res.status(400).json({ 
      error: `Duration cannot exceed ${maxDuration} minutes${emergencyAccess ? ' for emergency access' : ''}` 
    });
  }

  // Check if user already has an active elevation
  const existingElevation = await db.temporaryElevation.findFirst({
    where: {
      orgId: user.orgId,
      userId: user.id,
      status: { in: ['PENDING', 'APPROVED', 'ACTIVE'] }
    }
  });

  if (existingElevation) {
    return res.status(400).json({ 
      error: "You already have a pending or active elevation request",
      existingElevation: {
        id: existingElevation.id,
        status: existingElevation.status,
        targetRole: existingElevation.targetRole
      }
    });
  }

  // Get current user role
  const userRoles = await db.rbacUserRole.findMany({
    where: { userId: user.id, orgId: user.orgId },
    include: { role: true }
  });

  const currentRole = userRoles[0]?.role?.slug || 'staff';

  // Validate target role exists and is eligible
  const targetRoleRecord = await db.rbacRole.findFirst({
    where: { orgId: user.orgId, slug: targetRole }
  });

  if (!targetRoleRecord) {
    return res.status(400).json({ error: "Target role not found" });
  }

  // Get client IP and user agent for security
  const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  // Create elevation request
  const elevation = await db.temporaryElevation.create({
    data: {
      orgId: user.orgId,
      userId: user.id,
      requestedBy: user.id,
      targetRole,
      currentRole,
      reason,
      requestedDuration,
      emergencyAccess,
      approvalRequired: !emergencyAccess, // Emergency access auto-approved
      autoApproved: emergencyAccess,
      ipAddress: ipAddress as string,
      userAgent: userAgent as string,
      status: emergencyAccess ? 'APPROVED' : 'PENDING',
      ...(emergencyAccess && {
        approvedAt: new Date(),
        approvedBy: 'system_emergency',
        actualDuration: Math.min(requestedDuration, 30),
        expiresAt: new Date(Date.now() + Math.min(requestedDuration, 30) * 60 * 1000)
      })
    }
  });

  // If emergency access, activate immediately
  if (emergencyAccess) {
    await activateElevation(elevation.id);
  } else {
    // Send approval notification
    await sendApprovalNotification(elevation.id);
  }

  await auditAction(req, {
    action: 'elevation_request',
    target: 'temporary_elevation',
    targetId: elevation.id,
    category: 'AUTHORIZATION',
    severity: emergencyAccess ? 'WARNING' : 'INFO',
    details: { 
      targetRole,
      currentRole,
      requestedDuration,
      emergencyAccess,
      reason: reason.substring(0, 100) // Truncate for audit
    }
  });

  res.status(201).json({ 
    elevation,
    message: emergencyAccess ? 
      "Emergency elevation granted immediately" : 
      "Elevation request submitted for approval"
  });
}

async function approveElevation(req: NextApiRequest, res: NextApiResponse, user: any) {
  if (!(await assertPermission(req, res, PERMS.HR_MANAGE))) return;

  const { elevationId, actualDuration, notes } = req.body;

  if (!elevationId) {
    return res.status(400).json({ error: "Elevation ID is required" });
  }

  const elevation = await db.temporaryElevation.findFirst({
    where: {
      id: elevationId,
      orgId: user.orgId,
      status: 'PENDING'
    }
  });

  if (!elevation) {
    return res.status(404).json({ error: "Pending elevation request not found" });
  }

  const grantedDuration = actualDuration || elevation.requestedDuration;
  const expiresAt = new Date(Date.now() + grantedDuration * 60 * 1000);

  // Approve and activate the elevation
  const approvedElevation = await db.temporaryElevation.update({
    where: { id: elevationId },
    data: {
      status: 'APPROVED',
      approvedBy: user.id,
      approvedAt: new Date(),
      actualDuration: grantedDuration,
      expiresAt,
      terminationReason: notes
    }
  });

  // Activate the elevation
  await activateElevation(elevationId);

  await auditAction(req, {
    action: 'elevation_approve',
    target: 'temporary_elevation',
    targetId: elevationId,
    category: 'AUTHORIZATION',
    details: { 
      targetRole: elevation.targetRole,
      grantedDuration,
      approvedBy: user.id,
      notes
    }
  });

  res.json({ 
    elevation: approvedElevation,
    message: "Elevation approved and activated"
  });
}

// Helper functions
async function activateElevation(elevationId: string) {
  const elevation = await db.temporaryElevation.findUnique({
    where: { id: elevationId }
  });

  if (!elevation) return;

  // Update elevation status to active
  await db.temporaryElevation.update({
    where: { id: elevationId },
    data: {
      status: 'ACTIVE',
      activatedAt: new Date()
    }
  });

  // Set up auto-expiry (this would typically be handled by a background job)
  if (elevation.expiresAt) {
    scheduleElevationExpiry(elevationId, elevation.expiresAt);
  }
}

async function scheduleElevationExpiry(elevationId: string, expiresAt: Date) {
  // In a production system, this would be handled by a job queue or cron job
  // For now, we'll log it for background processing
  console.log(`Elevation ${elevationId} scheduled to expire at ${expiresAt}`);
}

async function sendApprovalNotification(elevationId: string) {
  // This would integrate with your notification system
  console.log(`Approval notification needed for elevation ${elevationId}`);
}

function determineRoleLevel(roleSlugs: string[]): number {
  const roleLevels: Record<string, number> = {
    'staff': 1,
    'supervisor': 2,
    'manager': 3,
    'admin': 4,
    'owner': 5
  };

  return Math.max(...roleSlugs.map(slug => roleLevels[slug] || 1));
}

function getElevationDescription(roleSlug: string): string {
  const descriptions: Record<string, string> = {
    'supervisor': 'Team oversight and task assignment capabilities',
    'manager': 'Department management and advanced reporting access',
    'admin': 'Administrative functions and user management',
    'owner': 'Full system access and configuration rights'
  };

  return descriptions[roleSlug] || 'Enhanced permissions for specific tasks';
}

function getMaxElevationDuration(roleSlug: string): number {
  const maxDurations: Record<string, number> = {
    'supervisor': 120,  // 2 hours
    'manager': 240,     // 4 hours
    'admin': 180,       // 3 hours
    'owner': 60         // 1 hour (high risk)
  };

  return maxDurations[roleSlug] || 60;
}

function requiresApprovalForRole(roleSlug: string): boolean {
  const autoApprove = ['supervisor'];
  return !autoApprove.includes(roleSlug);
}

function calculateRiskLevel(permissions: string[]): 'low' | 'medium' | 'high' {
  const highRiskPermissions = ['user:delete', 'billing:access', 'system:configure'];
  const mediumRiskPermissions = ['user:create', 'customer:delete', 'report:export'];
  
  if (permissions.some(p => highRiskPermissions.includes(p))) return 'high';
  if (permissions.some(p => mediumRiskPermissions.includes(p))) return 'medium';
  return 'low';
}

// Additional handlers for PUT and DELETE
async function handlePut(req: NextApiRequest, res: NextApiResponse, user: any) {
  const { action } = req.query;

  switch (action) {
    case "terminate":
      return await terminateElevation(req, res, user);
    case "extend":
      // TODO: Implement extendElevation function
      return res.status(501).json({ error: 'Elevation extension not yet implemented' });
    default:
      return res.status(400).json({ error: "Invalid action" });
  }
}

async function terminateElevation(req: NextApiRequest, res: NextApiResponse, user: any) {
  const { elevationId, reason } = req.body;

  const elevation = await db.temporaryElevation.findFirst({
    where: {
      id: elevationId,
      orgId: user.orgId,
      status: 'ACTIVE'
    }
  });

  if (!elevation) {
    return res.status(404).json({ error: "Active elevation not found" });
  }

  // Only the user themselves or a manager can terminate
  const canTerminate = elevation.userId === user.id || 
    await assertPermission(req, res, PERMS.HR_MANAGE);

  if (!canTerminate) {
    return res.status(403).json({ error: "Not authorized to terminate this elevation" });
  }

  const terminatedElevation = await db.temporaryElevation.update({
    where: { id: elevationId },
    data: {
      status: 'TERMINATED',
      terminatedAt: new Date(),
      terminatedBy: user.id,
      terminationReason: reason || 'Manual termination'
    }
  });

  await auditAction(req, {
    action: 'elevation_terminate',
    target: 'temporary_elevation',
    targetId: elevationId,
    category: 'AUTHORIZATION',
    details: { 
      terminatedBy: user.id,
      reason,
      originalExpiry: elevation.expiresAt
    }
  });

  res.json({ 
    elevation: terminatedElevation,
    message: "Elevation terminated successfully"
  });
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse, user: any) {
  // Allow cancelling pending requests
  const { elevationId } = req.query;

  const elevation = await db.temporaryElevation.findFirst({
    where: {
      id: elevationId as string,
      orgId: user.orgId,
      status: 'PENDING',
      userId: user.id // Only own requests
    }
  });

  if (!elevation) {
    return res.status(404).json({ error: "Pending elevation request not found" });
  }

  await db.temporaryElevation.update({
    where: { id: elevationId as string },
    data: {
      status: 'CANCELLED',
      terminatedAt: new Date(),
      terminatedBy: user.id,
      terminationReason: 'Cancelled by requester'
    }
  });

  await auditAction(req, {
    action: 'elevation_cancel',
    target: 'temporary_elevation',
    targetId: elevationId as string,
    category: 'AUTHORIZATION',
    details: { cancelledBy: user.id }
  });

  res.json({ message: "Elevation request cancelled" });
}