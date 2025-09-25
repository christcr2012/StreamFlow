// prisma/seed.ts
import { PrismaClient, Role, LeadSource, LeadStatus, Prisma } from "@prisma/client";
import crypto from "node:crypto";

const prisma = new PrismaClient();

/** Normalize + hash identity fields to create a stable dedup key */
function identityHash(input: { email?: string | null; phoneE164?: string | null; company?: string | null; name?: string | null }) {
  const norm = (s?: string | null) => (s ?? "").trim().toLowerCase();
  const key = [norm(input.email), norm(input.phoneE164), norm(input.company), norm(input.name)].filter(Boolean).join("|");
  return crypto.createHash("sha256").update(key).digest("hex").slice(0, 24);
}

function leadPublicId(): string {
  return `LEAD_${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

/** Build a JsonObject safely */
const j = (o: unknown): Prisma.JsonObject => (o ?? {}) as Prisma.JsonObject;

async function getOrCreateOrg(name: string) {
  let org = await prisma.org.findFirst({ where: { name } });
  if (!org) {
    org = await prisma.org.create({ data: { name, featureFlags: {} } });
    console.log("✅ Created org:", org.name, org.id);
  } else {
    console.log("ℹ️  Org exists:", org.name, org.id);
  }
  return org;
}

/** Ensure permission catalog exists (idempotent) */
async function ensurePermissions(codes: Array<{ code: string; description?: string | null }>) {
  for (const p of codes) {
    await prisma.rbacPermission.upsert({
      where: { code: p.code },
      update: { description: p.description ?? null },
      create: { code: p.code, description: p.description ?? null },
    });
  }
}

/** Create/update a system role (orgId = null) and wire its permissions */
async function upsertSystemRoleWithPerms(slug: string, name: string, permCodes: string[]) {
  const role = await prisma.$transaction(async (tx) => {
    const existing = await tx.rbacRole.findFirst({ where: { orgId: null, slug }, select: { id: true } });
    const r = existing
      ? await tx.rbacRole.update({ where: { id: existing.id }, data: { name, isSystem: true } })
      : await tx.rbacRole.create({ data: { orgId: null, slug, name, isSystem: true } });

    await tx.rbacRolePermission.deleteMany({ where: { roleId: r.id } });
    if (permCodes.length) {
      const perms = await tx.rbacPermission.findMany({ where: { code: { in: permCodes } }, select: { id: true } });
      if (perms.length) {
        await tx.rbacRolePermission.createMany({
          data: perms.map((p) => ({ roleId: r.id, permissionId: p.id })),
          skipDuplicates: true,
        });
      }
    }
    return r;
  });
  console.log(`✅ System role ready: ${slug}`);
  return role;
}

/** Handles composite unique when orgId may be NULL. */
async function ensureUserRole(userId: string, roleId: string, orgId: string | null) {
  if (orgId === null) {
    const existing = await prisma.rbacUserRole.findFirst({
      where: { userId, roleId, orgId: null },
      select: { id: true },
    });
    if (!existing) {
      await prisma.rbacUserRole.create({ data: { userId, roleId, orgId: null } });
    }
    return;
  }

  await prisma.rbacUserRole.upsert({
    where: { userId_roleId_orgId: { userId, roleId, orgId } },
    update: {},
    create: { userId, roleId, orgId },
  });
}

/** Seed RBAC: permissions, system roles, and user-role links */
async function seedRBAC(opts: { ownerEmail: string; providerEmail: string; orgId: string }) {
  const { ownerEmail, providerEmail, orgId } = opts;

  const PERMS = [
    { code: "dashboard:view", description: "View dashboard" },
    { code: "lead:read",      description: "Read leads" },
    { code: "lead:create",    description: "Create leads" },
    { code: "lead:update",    description: "Update leads" },
    { code: "lead:delete",    description: "Delete leads" },
    { code: "lead:export",    description: "Export leads" },
    { code: "roles:manage",   description: "Manage roles & permissions" },
    { code: "billing:manage", description: "Manage billing (Stripe)" },
  ];
  await ensurePermissions(PERMS);

  const OWNER_PERMS    = PERMS.map((p) => p.code);
  const MANAGER_PERMS  = ["dashboard:view","lead:read","lead:create","lead:update","lead:delete","lead:export"];
  const STAFF_PERMS    = ["dashboard:view","lead:read","lead:create","lead:update"];
  const VIEWER_PERMS   = ["dashboard:view","lead:read"];
  const PROVIDER_PERMS = OWNER_PERMS;

  const ownerRole    = await upsertSystemRoleWithPerms("owner",    "Owner",    OWNER_PERMS);
  const managerRole  = await upsertSystemRoleWithPerms("manager",  "Manager",  MANAGER_PERMS);
  const staffRole    = await upsertSystemRoleWithPerms("staff",    "Staff",    STAFF_PERMS);
  const viewerRole   = await upsertSystemRoleWithPerms("viewer",   "Viewer",   VIEWER_PERMS);
  const providerRole = await upsertSystemRoleWithPerms("provider", "Provider", PROVIDER_PERMS);
  void managerRole; void staffRole; void viewerRole;

  const ownerUser    = await prisma.user.findFirst({ where: { email: ownerEmail }, select: { id: true } });
  const providerUser = await prisma.user.findFirst({ where: { email: providerEmail }, select: { id: true } });

  if (ownerUser) await ensureUserRole(ownerUser.id, ownerRole.id, orgId);
  if (providerUser) await ensureUserRole(providerUser.id, providerRole.id, null);
}

/** Seed a few demo leads (one converted & billable) */
async function seedDemoLeads(orgId: string) {
  const now = new Date();
  const twoDaysAgoUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), Math.max(1, now.getUTCDate() - 2)));

  const leadsInput = [
    {
      company: "Sterling Office Park",
      contactName: "Alex Carter",
      email: "alex@sterlingop.com",
      phoneE164: "+19705550101",
      website: "https://sterlingop.com",
      serviceCode: "janitorial",
      addressLine1: "123 Main St",
      addressLine2: null as string | null,
      city: "Greeley",
      state: "CO",
      zip: "80631",
      postalCode: null as string | null,
      country: "US",
      notes: "Evening cleaning, M/W/F.",
      sourceType: LeadSource.MANUAL_EXISTING_CUSTOMER,
      status: LeadStatus.NEW,
      convertedAt: null as Date | null,
      enrichment: j({ billing: { billableEligible: false } }),
      aiScore: 72,
    },
    {
      company: "High Plains Credit Union",
      contactName: "Brianna V",
      email: "brianna@hpcredit.org",
      phoneE164: "+19705550102",
      website: null as string | null,
      serviceCode: "floorcare",
      addressLine1: "45 Center Ave",
      addressLine2: "Suite 200",
      city: "Sterling",
      state: "CO",
      zip: "80751",
      postalCode: null as string | null,
      country: "US",
      notes: "Quarterly strip & wax.",
      sourceType: LeadSource.MANUAL_EMPLOYEE_REFERRAL,
      status: LeadStatus.CONVERTED,
      convertedAt: twoDaysAgoUTC,
      enrichment: j({ billing: { billableEligible: true, unitPriceCents: 10000 } }),
      aiScore: 84,
    },
    {
      company: "Frontier Dental",
      contactName: "Dr. Lee",
      email: "office@frontierdental.co",
      phoneE164: "+19705550103",
      website: "https://frontierdental.co",
      serviceCode: "disinfection",
      addressLine1: "900 Health Way",
      addressLine2: null as string | null,
      city: "Fort Collins",
      state: "CO",
      zip: "80525",
      postalCode: null as string | null,
      country: "US",
      notes: "Clinic-grade protocol required.",
      sourceType: LeadSource.MANUAL_NEW_CUSTOMER,
      status: LeadStatus.NEW,
      convertedAt: null,
      enrichment: j({}),
      aiScore: 65,
    },
  ];

  for (const li of leadsInput) {
    const publicId = leadPublicId();
    const ih = identityHash({ email: li.email, phoneE164: li.phoneE164, company: li.company, name: li.contactName });

    const lead = await prisma.lead.create({
      data: {
        orgId,
        publicId,
        sourceType: li.sourceType,
        identityHash: ih,
        company: li.company ?? null,
        contactName: li.contactName ?? null,
        email: li.email ?? null,
        phoneE164: li.phoneE164 ?? null,
        website: li.website ?? null,
        serviceCode: li.serviceCode ?? null,
        address: li.addressLine1 ? `${li.addressLine1}${li.addressLine2 ? ", " + li.addressLine2 : ""}` : null,
        addressLine1: li.addressLine1 ?? null,
        addressLine2: li.addressLine2 ?? null,
        city: li.city ?? null,
        state: li.state ?? null,
        zip: li.zip ?? null,
        postalCode: li.postalCode ?? null,
        country: li.country ?? null,
        enrichmentJson: li.enrichment,
        aiScore: li.aiScore,
        scoreFactors: j({ reasons: ["Seeded sample lead"] }),
        notes: li.notes ?? null,
        status: li.status,
        convertedAt: li.convertedAt,
      },
      select: { id: true, publicId: true },
    });

    console.log("🌱 Seeded lead:", lead.publicId);
  }
}

async function main() {
  // ---- 0) Inputs ----
  const ORG_NAME = "Mountain Vista Cleaning Services, LLC";
  const OWNER_EMAIL = "mountainvistaclean@gmail.com";
  const STAFF_EMAIL = process.env.SEED_STAFF_EMAIL || "staff@mountain-vista.example";
  const PROVIDER_EMAIL = "chris.tcr.2012@gmail.com";

  // ---- 1) Org ----
  const org = await getOrCreateOrg(ORG_NAME);

  // ---- 2) Users ----
  const owner = await prisma.user.upsert({
    where: { email: OWNER_EMAIL },
    update: { orgId: org.id, role: Role.OWNER, status: "active" },
    create: { orgId: org.id, email: OWNER_EMAIL, name: "Business Owner", role: Role.OWNER, status: "active" },
  });
  console.log("👤 Owner user:", owner.email);

  const staff = await prisma.user.upsert({
    where: { email: STAFF_EMAIL },
    update: { orgId: org.id, role: Role.STAFF, status: "active" },
    create: { orgId: org.id, email: STAFF_EMAIL, name: "Team Member", role: Role.STAFF, status: "active" },
  });
  console.log("👤 Staff user:", staff.email);

  const provider = await prisma.user.upsert({
    where: { email: PROVIDER_EMAIL },
    update: { orgId: org.id, name: "Chris (Provider)", status: "active" },
    create: { orgId: org.id, email: PROVIDER_EMAIL, name: "Chris (Provider)", status: "active" },
  });
  console.log("👤 Provider user:", provider.email);

  // ---- 3) Demo leads ----
  await seedDemoLeads(org.id);

  // ---- 4) RBAC ----
  await seedRBAC({ ownerEmail: OWNER_EMAIL, providerEmail: PROVIDER_EMAIL, orgId: org.id });

  console.log("✅ Seed complete.");
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => {
    console.error("❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
