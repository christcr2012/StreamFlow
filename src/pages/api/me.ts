// src/pages/api/me.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma as db } from "@/lib/prisma";
import { PERMS as SERVER_PERMS, getEmailFromReq } from "@/lib/rbac";
import type { MeResponse, OrgShape, BrandConfig } from "@/lib/types/me";

/**
 * Validate and sanitize brandConfig from database to ensure type safety
 */
function validateBrandConfig(rawBrandConfig: unknown): BrandConfig {
  if (!rawBrandConfig || typeof rawBrandConfig !== 'object') {
    return {};
  }
  
  const config = rawBrandConfig as Record<string, unknown>;
  const result: BrandConfig = {};
  
  // Validate name (string)
  if (typeof config.name === 'string' && config.name.trim()) {
    result.name = config.name.trim();
  }
  
  // Validate logoUrl (string, basic URL format)
  if (typeof config.logoUrl === 'string' && config.logoUrl.trim()) {
    const url = config.logoUrl.trim();
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) {
      result.logoUrl = url;
    }
  }
  
  // Validate color (hex or named color)
  if (typeof config.color === 'string' && config.color.trim()) {
    const color = config.color.trim();
    const hexPattern = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/;
    const namedColors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'gray', 'black', 'white'];
    
    if (hexPattern.test(color) || namedColors.includes(color.toLowerCase())) {
      result.color = color;
    }
  }
  
  return result;
}

/**
 * Determine the current user interface space based on authentication context
 */
function determineUserSpace(req: NextApiRequest): "client" | "provider" | "developer" | "accountant" | null {
  // Check authentication cookies to determine which space the user is in
  if (req.cookies.ws_provider) return "provider";
  if (req.cookies.ws_developer) return "developer";
  if (req.cookies.ws_accountant) return "accountant";
  if (req.cookies.ws_user) return "client";
  return null;
}

/**
 * Compute effective permission codes for a user:
 *  - Union of all permissions from RBAC roles assigned to the user
 *  - Plus legacy fallbacks based on baseRole (OWNER/MANAGER/STAFF)
 */
async function computePermCodes(userId: string, baseRole?: string | null): Promise<Set<string>> {
  const roleLinks = await db.rbacUserRole.findMany({
    where: { userId },
    select: { roleId: true },
  });

  const roleIds = roleLinks.map((r) => r.roleId);
  const rolePerms = roleIds.length
    ? await db.rbacRolePermission.findMany({
        where: { roleId: { in: roleIds } },
        include: { permission: true },
      })
    : [];

  const codes = new Set<string>(rolePerms.map((rp) => rp.permission.code));

  // Legacy fallbacks for convenience (aligns with src/lib/rbac.ts)
  switch ((baseRole || "").toUpperCase()) {
    case "OWNER":
      Object.values(SERVER_PERMS).forEach((c) => codes.add(c));
      break;
    case "MANAGER":
      ["dashboard:view", "lead:read", "lead:create", "lead:update", "lead:delete", "lead:export"].forEach((c) =>
        codes.add(c)
      );
      break;
    case "STAFF":
      ["dashboard:view", "lead:read", "lead:create", "lead:update"].forEach((c) => codes.add(c));
      break;
    // PROVIDER / ACCOUNTANT / VIEWER: no implicit extras here
  }

  return codes;
}

/**
 * Handle PATCH requests to update user profile
 */
async function handleProfileUpdate(req: NextApiRequest, res: NextApiResponse, email: string) {
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const name = body.name?.toString()?.trim();

    // Validate input
    if (name !== undefined && (name.length === 0 || name.length > 100)) {
      return res.status(400).json({ ok: false, error: "Name must be between 1 and 100 characters" });
    }

    // Find user by email (from session)
    const user = await db.user.findFirst({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }

    // Update user profile
    const updateData: { name?: string } = {};
    if (name !== undefined) {
      updateData.name = name || null; // Allow clearing name by setting empty string
    }

    await db.user.update({
      where: { id: user.id },
      data: updateData,
    });

    return res.status(200).json({ 
      ok: true, 
      message: "Profile updated successfully" 
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return res.status(500).json({ ok: false, error: "Failed to update profile" });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<MeResponse>) {
  try {
    const email = getEmailFromReq(req);
    if (!email) return res.status(401).json({ ok: false, error: "Not signed in" });

    // Handle PATCH requests for profile updates
    if (req.method === "PATCH") {
      return await handleProfileUpdate(req, res, email);
    }

    // Handle GET requests (existing functionality)
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET", "PATCH"]);
      return res.status(405).json({ ok: false, error: "Method not allowed" });
    }

    // 🚨 TEMP DEV CODE - DELETE BEFORE PRODUCTION 🚨
    // Development test user system - matches rbac.ts and auth-helpers.ts
    const DEV_USERS = {
      owner: process.env.DEV_OWNER_EMAIL?.toLowerCase() || 'owner@test.com',
      manager: process.env.DEV_MANAGER_EMAIL?.toLowerCase() || 'manager@test.com',
      staff: process.env.DEV_STAFF_EMAIL?.toLowerCase() || 'staff@test.com',
    } as const;
    const DEV_USER_EMAIL = process.env.DEV_USER_EMAIL?.toLowerCase() || null;

    // Check if this is a development test user (only in non-production)
    if (process.env.NODE_ENV !== 'production') {
      let devRole: string | null = null;
      let devUserName = "Dev User";
      
      // Check configured dev users
      for (const [role, devEmail] of Object.entries(DEV_USERS)) {
        if (devEmail && email.toLowerCase() === devEmail) {
          devRole = role.toUpperCase();
          devUserName = `Dev ${role.charAt(0).toUpperCase() + role.slice(1)} User`;
          break;
        }
      }
      
      // Legacy support - DEV_USER_EMAIL gets OWNER role
      if (!devRole && DEV_USER_EMAIL && email.toLowerCase() === DEV_USER_EMAIL) {
        devRole = "OWNER";
        devUserName = "Dev Owner User";
      }

      if (devRole) {
        // Get proper RBAC permissions for this specific dev role (not bypass)
        const codes = await computePermCodes('dev-user-id', devRole);
        const perms = Array.from(codes).sort();
        const currentSpace = determineUserSpace(req);
        const devOrgId = process.env.DEV_ORG_ID || null;

        return res.status(200).json({
          ok: true,
          user: {
            id: `dev-user-${email.toLowerCase()}`, // Generate consistent dev user ID
            email: email.toLowerCase(),
            name: devUserName,
            baseRole: devRole as "OWNER" | "MANAGER" | "STAFF" | "PROVIDER" | "ACCOUNTANT" | "VIEWER",
            rbacRoles: [devRole.toLowerCase()], // Single role for testing specific functionality
            isOwner: devRole === "OWNER",
            isProvider: devRole === "PROVIDER",
            perms, // Proper role-based permissions
            // New fields for GitHub issue #1
            tenantId: devOrgId, // Use DEV_ORG_ID as tenantId for dev users
            space: currentSpace,
            roles: [devRole.toLowerCase()], // Alias for rbacRoles
            orgId: devOrgId,
          },
          ...(devOrgId ? {
            org: {
              id: devOrgId,
              name: "Dev Test Organization",
              featureFlags: { allFeaturesEnabled: true },
              brandConfig: { name: "WorkStream Dev" }
            }
          } : {})
        });
      }
    }

    const user = await db.user.findFirst({
      where: { email },
      select: { id: true, email: true, name: true, role: true, orgId: true },
    });
    if (!user) return res.status(404).json({ ok: false, error: "User not found" });

    // RBAC role slugs for the user
    const links = await db.rbacUserRole.findMany({
      where: { userId: user.id },
      select: { role: { select: { slug: true } } },
    });
    const rbacSlugs = Array.from(new Set(links.map((l) => l.role.slug).filter(Boolean)));

    const isOwner = (user.role || "").toUpperCase() === "OWNER" || rbacSlugs.includes("owner");
    const isProvider = rbacSlugs.includes("provider");

    // Optional org info
    let orgPayload: OrgShape | undefined;
    if (user.orgId) {
      const org = await db.org.findUnique({
        where: { id: user.orgId },
        select: { id: true, name: true, featureFlags: true, brandConfig: true },
      });
      if (org) {
        orgPayload = {
          id: org.id,
          name: org.name,
          /**
           * IMPORTANT CONTRACT:
           * - We intentionally pass featureFlags through as-is (unknown JSON).
           * - Client code should narrow with helpers (see src/lib/featureFlags.ts)
           *   to avoid assuming a premature shape while the system is evolving.
           */
          featureFlags: org.featureFlags as unknown,
          brandConfig: validateBrandConfig(org.brandConfig), // White-label branding configuration
        };
      }
    }

    // Effective permission codes
    const codes = await computePermCodes(user.id, user.role);
    const perms = Array.from(codes).sort();
    const currentSpace = determineUserSpace(req);

    return res.status(200).json({
      ok: true,
      user: {
        id: user.id, // User ID from database
        email: user.email,
        name: user.name,
        baseRole: (user.role || "VIEWER") as "OWNER" | "MANAGER" | "STAFF" | "PROVIDER" | "ACCOUNTANT" | "VIEWER",
        rbacRoles: rbacSlugs,
        isOwner,
        isProvider,
        perms,
        // New fields for GitHub issue #1
        tenantId: user.orgId, // tenantId is equivalent to orgId in our multi-tenant system
        space: currentSpace,
        roles: rbacSlugs, // Alias for rbacRoles for consistency
        orgId: user.orgId,
      },
      ...(orgPayload ? { org: orgPayload } : {}),
    });
  } catch (e: unknown) {
    const msg = (e as { message?: string } | undefined)?.message || "Server error";
    return res.status(500).json({ ok: false, error: msg });
  }
}
