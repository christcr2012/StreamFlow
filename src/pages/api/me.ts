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

    // RBAC BYPASS: Test accounts get full permissions (zero setup required)
    const BYPASS_TEST_ACCOUNTS = {
      'owner@test.com': { role: 'OWNER', name: 'Test Owner' },
      'manager@test.com': { role: 'MANAGER', name: 'Test Manager' },
      'staff@test.com': { role: 'STAFF', name: 'Test Staff' },
      'accountant@test.com': { role: 'ACCOUNTANT', name: 'Test Accountant' },
      'provider@test.com': { role: 'PROVIDER', name: 'Test Provider' },
    } as const;
    
    function isBypassEnabled(): boolean {
      if (process.env.NODE_ENV === 'development') return true;
      if (process.env.VERCEL_ENV === 'preview') return true;
      if (process.env.TEST_USERS_ENABLED === 'true') return true;
      return false;
    }

    // Check for bypass test accounts
    if (isBypassEnabled()) {
      const account = BYPASS_TEST_ACCOUNTS[email.toLowerCase() as keyof typeof BYPASS_TEST_ACCOUNTS];
      const DEV_USER_EMAIL = process.env.DEV_USER_EMAIL?.toLowerCase() || null;
      
      if (account || (DEV_USER_EMAIL && email.toLowerCase() === DEV_USER_EMAIL)) {
        const role = account?.role || 'OWNER';
        const name = account?.name || 'Dev User';
        
        // BYPASS: Grant ALL permissions regardless of role
        const allPerms = Object.values(SERVER_PERMS).sort();
        
        return res.status(200).json({
          ok: true,
          user: {
            email: email.toLowerCase(),
            name,
            baseRole: role as "OWNER" | "MANAGER" | "STAFF" | "PROVIDER" | "ACCOUNTANT" | "VIEWER",
            rbacRoles: [role.toLowerCase()],
            isOwner: true, // Bypass accounts always have owner privileges
            isProvider: role === "PROVIDER",
            perms: allPerms, // ALL permissions for testing
          },
          org: {
            id: 'bypass-test-org',
            name: 'Test Organization',
            featureFlags: { allFeaturesEnabled: true },
            brandConfig: { name: 'WorkStream Test' }
          }
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

    return res.status(200).json({
      ok: true,
      user: {
        email: user.email,
        name: user.name,
        baseRole: (user.role || "VIEWER") as "OWNER" | "MANAGER" | "STAFF" | "PROVIDER" | "ACCOUNTANT" | "VIEWER",
        rbacRoles: rbacSlugs,
        isOwner,
        isProvider,
        perms,
      },
      ...(orgPayload ? { org: orgPayload } : {}),
    });
  } catch (e: unknown) {
    const msg = (e as { message?: string } | undefined)?.message || "Server error";
    return res.status(500).json({ ok: false, error: msg });
  }
}
