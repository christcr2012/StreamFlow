// src/pages/api/admin/bootstrap.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma as db } from "@/lib/prisma";
import type { Role } from "@prisma/client";

// same catalog used elsewhere
const PERMS = {
  DASHBOARD_VIEW: "dashboard:view",
  LEAD_READ: "lead:read",
  LEAD_CREATE: "lead:create",
  LEAD_UPDATE: "lead:update",
  LEAD_DELETE: "lead:delete",
  LEAD_EXPORT: "lead:export",
  ROLES_MANAGE: "roles:manage",
  BILLING_MANAGE: "billing:manage",
} as const;

const PERMISSION_SEED: Array<{ code: string; description: string }> = [
  { code: PERMS.DASHBOARD_VIEW, description: "View dashboard" },
  { code: PERMS.LEAD_READ,      description: "Read leads" },
  { code: PERMS.LEAD_CREATE,    description: "Create leads" },
  { code: PERMS.LEAD_UPDATE,    description: "Update leads" },
  { code: PERMS.LEAD_DELETE,    description: "Delete leads" },
  { code: PERMS.LEAD_EXPORT,    description: "Export leads" },
  { code: PERMS.ROLES_MANAGE,   description: "Manage roles & permissions" },
  { code: PERMS.BILLING_MANAGE, description: "Manage billing" },
];

type RoleSeed = { slug: string; name: string; perms: string[]; isSystem?: boolean };
const ROLE_SEED: RoleSeed[] = [
  {
    slug: "owner", name: "Owner", isSystem: true,
    perms: Object.values(PERMS),
  },
  {
    slug: "manager", name: "Manager", isSystem: true,
    perms: [PERMS.DASHBOARD_VIEW, PERMS.LEAD_READ, PERMS.LEAD_CREATE, PERMS.LEAD_UPDATE, PERMS.LEAD_DELETE, PERMS.LEAD_EXPORT],
  },
  {
    slug: "staff", name: "Staff", isSystem: true,
    perms: [PERMS.DASHBOARD_VIEW, PERMS.LEAD_READ, PERMS.LEAD_CREATE, PERMS.LEAD_UPDATE],
  },
  {
    slug: "viewer", name: "Viewer", isSystem: true,
    perms: [PERMS.DASHBOARD_VIEW, PERMS.LEAD_READ],
  },
  {
    slug: "employee", name: "Employee", isSystem: true,
    perms: [PERMS.DASHBOARD_VIEW, PERMS.LEAD_READ],
  },
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).end("Method Not Allowed");
    }

    // Very important: require a secret bootstrap token
    const token = req.headers["x-bootstrap-token"] as string | undefined;
    if (!token || token !== process.env.ADMIN_BOOTSTRAP_TOKEN) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const { email, orgName, alsoProvider, industryType, naicsCode } = (typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body) as {
      email?: string; orgName?: string; alsoProvider?: boolean; industryType?: string; naicsCode?: string;
    };

    if (!email || !orgName) {
      return res.status(400).json({ ok: false, error: "email and orgName required" });
    }
    const normEmail = email.trim().toLowerCase();

    // 1) Permissions
    for (const p of PERMISSION_SEED) {
      await db.rbacPermission.upsert({
        where: { code: p.code },
        update: {},
        create: { code: p.code, description: p.description },
      });
    }
    const permRows = await db.rbacPermission.findMany();
    const permIdByCode = new Map(permRows.map(r => [r.code, r.id]));

    // 2) Roles (system roles: orgId = null)
    for (const role of ROLE_SEED) {
      const existing = await db.rbacRole.findFirst({ where: { orgId: null, slug: role.slug } });
      const saved = existing
        ? await db.rbacRole.update({ where: { id: existing.id }, data: { name: role.name, isSystem: true } })
        : await db.rbacRole.create({ data: { orgId: null, slug: role.slug, name: role.name, isSystem: true } });

      // refresh role perms
      await db.rbacRolePermission.deleteMany({ where: { roleId: saved.id } });
      const ids = role.perms.map(c => permIdByCode.get(c)!).filter(Boolean);
      if (ids.length) {
        await db.rbacRolePermission.createMany({
          data: ids.map(pid => ({ roleId: saved.id, permissionId: pid })),
          skipDuplicates: true,
        });
      }
    }

    // 3) Org with Industry Configuration
    let org = await db.org.findFirst({ where: { name: orgName } });
    if (!org) {
      // Get industry pack configuration if specified
      let industryConfig = {};
      let activeCapabilities: string[] = [];
      
      if (industryType) {
        const industryPack = await db.industryPack.findUnique({
          where: { industryCode: industryType },
          include: {
            capabilities: {
              include: { capability: true },
              where: { defaultEnabled: true }
            }
          }
        });
        
        if (industryPack) {
          // Note: industryConfig is stored in the IndustryPack model but may be used for future expansion
          industryConfig = {};
          activeCapabilities = industryPack.capabilities.map(ic => ic.capability.code);
          console.log(`🏭 Configuring org for ${industryPack.displayName} with ${activeCapabilities.length} capabilities`);
        }
      }
      
      org = await db.org.create({ 
        data: { 
          name: orgName, 
          featureFlags: {},
          industryType: industryType || null,
          naicsCode: naicsCode || null,
          industryConfig,
          activeCapabilities
        } 
      });
    }

    // 4) User upsert (make sure user exists and is active + linked to org; set legacy role=OWNER)
    const user = await db.user.upsert({
      where: { email: normEmail },
      update: { orgId: org.id, status: "active", role: "OWNER" as Role },
      create: { orgId: org.id, email: normEmail, name: "Admin", status: "active", role: "OWNER" as Role },
      select: { id: true, email: true, orgId: true, role: true, status: true },
    });

    // 5) Assign OWNER role (RBAC link scoped to org)
    const ownerRole = await db.rbacRole.findFirst({ where: { orgId: null, slug: "owner" } });
    if (ownerRole) {
      const exists = await db.rbacUserRole.findFirst({
        where: { userId: user.id, roleId: ownerRole.id, orgId: org.id },
      });
      if (!exists) {
        await db.rbacUserRole.create({ data: { userId: user.id, roleId: ownerRole.id, orgId: org.id } });
      }
    }

    // 6) Optionally assign PROVIDER system-wide (orgId null on link)
    if (alsoProvider) {
      const providerRole = await db.rbacRole.findFirst({ where: { orgId: null, slug: "provider" } });
      if (providerRole) {
        const exists = await db.rbacUserRole.findFirst({
          where: { userId: user.id, roleId: providerRole.id, orgId: null },
        });
        if (!exists) {
          await db.rbacUserRole.create({ data: { userId: user.id, roleId: providerRole.id, orgId: null } });
        }
      }
    }

    return res.status(200).json({ ok: true, user, org, assigned: { owner: !!ownerRole, provider: !!alsoProvider } });
  } catch (e: unknown) {
    console.error("/api/admin/bootstrap error:", e);
    const message = e instanceof Error ? e.message : "Internal Server Error";
    return res.status(500).json({ ok: false, error: message });
  }
}
