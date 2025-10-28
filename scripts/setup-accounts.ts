/**
 * Account Setup Script
 *
 * Creates all necessary accounts in the database:
 * - Provider account (system admin)
 * - Developer account (development access)
 * - Accountant account (financial access)
 * - Test client accounts (owner, manager, staff)
 *
 * Run with: npm run setup-accounts
 *
 * This script is idempotent - safe to run multiple times
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Account configurations
// NOTE: Provider and Developer accounts are environment-based (not database-backed)
// Only creating database accounts for roles that exist in the Prisma Role enum:
// OWNER, MANAGER, STAFF, PROVIDER, ACCOUNTANT
const ACCOUNTS = {
  accountant: {
    email: "accountant@streamflow.com",
    password: "Thrillicious01no", // Will be hashed
    name: "Accountant",
    role: "ACCOUNTANT" as const,
  },
  testOwner: {
    email: "owner@test.com",
    password: "test",
    name: "Test Owner",
    role: "OWNER" as const,
  },
  testManager: {
    email: "manager@test.com",
    password: "test",
    name: "Test Manager",
    role: "MANAGER" as const,
  },
  testStaff: {
    email: "staff@test.com",
    password: "test",
    name: "Test Staff",
    role: "STAFF" as const,
  },
};

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function getOrCreateOrg(name: string) {
  try {
    // Check if org already exists
    const existing = await prisma.org.findFirst({
      where: { name },
    });

    if (existing) {
      console.log(`✅ Organization already exists: ${name}`);
      return existing;
    }

    // Create organization
    const org = await prisma.org.create({
      data: {
        name,
        featureFlags: {},
        brandConfig: {},
        settingsJson: {},
      },
    });

    console.log(`✅ Created organization: ${name}`);
    return org;
  } catch (error) {
    console.error(`❌ Failed to create organization: ${name}`, error);
    throw error;
  }
}

async function createAccount(
  email: string,
  password: string,
  name: string,
  role: string,
  orgId: string,
) {
  try {
    // Check if account already exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      console.log(`✅ Account already exists: ${email} (${role})`);
      return existing;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create account
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        name,
        role: role as any,
        orgId,
        isActive: true,
        isLocked: false,
        failedLoginAttempts: 0,
      },
    });

    console.log(`✅ Created account: ${email} (${role})`);
    return user;
  } catch (error) {
    console.error(`❌ Failed to create account: ${email}`, error);
    throw error;
  }
}

async function createOrGetSystemOrg() {
  try {
    const existing = await prisma.org.findFirst({
      where: { name: "Robinson Solutions - System" },
    });

    if (existing) {
      console.log(`✅ System organization already exists: ${existing.id}`);
      return existing;
    }

    const org = await prisma.org.create({
      data: {
        name: "Robinson Solutions - System",
        featureFlags: { systemOrg: true },
        aiMonthlyBudgetCents: 50000,
        aiCreditBalance: 10000,
        aiPlan: "ELITE",
        aiAlerts: {},
        brandConfig: {
          name: "Robinson Solutions",
          primaryColor: "#10b981",
          logoUrl: "",
        },
        settingsJson: { isSystemOrg: true },
      },
    });

    console.log(`✅ Created system organization: ${org.id}`);
    return org;
  } catch (error) {
    console.error("❌ Failed to create system organization:", error);
    throw error;
  }
}

async function createOrGetTestOrg() {
  try {
    const existing = await prisma.org.findFirst({
      where: { name: "Test Client Organization" },
    });

    if (existing) {
      console.log(`✅ Test client organization already exists: ${existing.id}`);
      return existing;
    }

    const org = await prisma.org.create({
      data: {
        name: "Test Client Organization",
        featureFlags: {},
        aiMonthlyBudgetCents: 5000,
        aiCreditBalance: 1000,
        aiPlan: "BASE",
        aiAlerts: {},
        brandConfig: {
          name: "Test Company",
          primaryColor: "#10b981",
          logoUrl: "",
        },
        settingsJson: {},
      },
    });

    console.log(`✅ Created test client organization: ${org.id}`);
    return org;
  } catch (error) {
    console.error("❌ Failed to create test organization:", error);
    throw error;
  }
}

async function setupAccounts() {
  console.log("🚀 Starting account setup...\n");

  try {
    // Create system organization for provider/developer/accountant
    console.log("📋 Setting up REAL system organization...");
    const systemOrg = await createOrGetSystemOrg();

    // Create test organization for client accounts
    console.log("\n📋 Setting up TEST client organization...");
    const testOrg = await createOrGetTestOrg();

    // Create accountant account (system organization)
    console.log("\n📋 Creating accountant account...");
    await createAccount(
      ACCOUNTS.accountant.email,
      ACCOUNTS.accountant.password,
      ACCOUNTS.accountant.name,
      ACCOUNTS.accountant.role,
      systemOrg.id,
    );

    // Create test client accounts
    console.log("\n📋 Creating TEST client accounts...");
    await createAccount(
      ACCOUNTS.testOwner.email,
      ACCOUNTS.testOwner.password,
      ACCOUNTS.testOwner.name,
      ACCOUNTS.testOwner.role,
      testOrg.id,
    );

    await createAccount(
      ACCOUNTS.testManager.email,
      ACCOUNTS.testManager.password,
      ACCOUNTS.testManager.name,
      ACCOUNTS.testManager.role,
      testOrg.id,
    );

    await createAccount(
      ACCOUNTS.testStaff.email,
      ACCOUNTS.testStaff.password,
      ACCOUNTS.testStaff.name,
      ACCOUNTS.testStaff.role,
      testOrg.id,
    );

    console.log("\n✅ Account setup complete!\n");
    console.log("📝 Account Summary:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ DATABASE ACCOUNTS CREATED:");
    console.log("\nSystem Account (Robinson Solutions - System):");
    console.log(`  Accountant: ${ACCOUNTS.accountant.email}`);
    console.log("\nTest Client Accounts (Test Client Organization):");
    console.log(`  Owner:      ${ACCOUNTS.testOwner.email} / [REDACTED]`); // Security: Don't log passwords
    console.log(`  Manager:    ${ACCOUNTS.testManager.email} / [REDACTED]`); // Security: Don't log passwords
    console.log(`  Staff:      ${ACCOUNTS.testStaff.email} / [REDACTED]`); // Security: Don't log passwords
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n📝 ENVIRONMENT-BASED ACCOUNTS (not in database):");
    console.log(
      "  Provider and Developer accounts are configured via .env.local:",
    );
    console.log("    - DEV_PROVIDER_EMAIL / DEV_PROVIDER_PASSWORD");
    console.log("    - DEV_DEVELOPER_EMAIL / DEV_DEVELOPER_PASSWORD");
    console.log("    - DEV_ACCEPT_ANY_PROVIDER_LOGIN=true (dev mode)");
    console.log("    - DEV_ACCEPT_ANY_DEVELOPER_LOGIN=true (dev mode)");
    console.log("\n🔐 Security Notes:");
    console.log(
      "  - All database passwords are hashed with bcrypt (cost factor: 12)",
    );
    console.log("  - System account passwords should be changed in production");
    console.log("  - Test accounts use simple passwords for development only");
    console.log("  - Provider/Developer accounts bypass database in dev mode");
    console.log("\n🎯 Next Steps:");
    console.log("  1. Test Provider login at: http://localhost:5000/provider");
    console.log(
      "  2. Test Developer login at: http://localhost:5000/developer",
    );
    console.log(
      "  3. Test Accountant login at: http://localhost:5000/accountant",
    );
    console.log("  4. Test Client logins at: http://localhost:5000/login");
    console.log("\n");
  } catch (error) {
    console.error("❌ Account setup failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
setupAccounts()
  .then(() => {
    console.log("✅ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });
