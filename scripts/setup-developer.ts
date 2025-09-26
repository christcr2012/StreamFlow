// scripts/setup-developer.ts
/**
 * Set up Developer role and user for development work.
 * This gives full access separate from the limited Provider role.
 */
import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/passwords";

async function main() {
  console.log("🔧 Setting up Developer role and user...");

  // 1. Create Developer role if it doesn't exist
  let developerRole = await prisma.rbacRole.findFirst({
    where: { slug: "developer" }
  });

  if (!developerRole) {
    developerRole = await prisma.rbacRole.create({
      data: {
        slug: "developer",
        name: "Developer",
      }
    });
    console.log("✅ Created Developer role");
  } else {
    console.log("✅ Developer role already exists");
  }

  // 2. Get all permissions
  const allPermissions = await prisma.rbacPermission.findMany();
  console.log(`📋 Found ${allPermissions.length} permissions`);

  // 3. Assign all permissions to Developer role
  for (const permission of allPermissions) {
    await prisma.rbacRolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: developerRole.id,
          permissionId: permission.id,
        }
      },
      update: {},
      create: {
        roleId: developerRole.id,
        permissionId: permission.id,
      }
    });
  }
  console.log(`✅ Assigned all ${allPermissions.length} permissions to Developer role`);

  // 4. Create developer user (using your email for development)
  const DEV_EMAIL = "dev@mountain-vista.local";
  const DEV_PASSWORD = "dev123";

  let devUser = await prisma.user.findFirst({
    where: { email: DEV_EMAIL }
  });

  if (!devUser) {
    // Get the first org
    const org = await prisma.org.findFirst();
    if (!org) {
      throw new Error("No organization found. Run seed first.");
    }

    const passwordHash = await hashPassword(DEV_PASSWORD);
    devUser = await prisma.user.create({
      data: {
        email: DEV_EMAIL,
        name: "Developer User",
        role: "OWNER", // Legacy role for compatibility
        orgId: org.id,
        status: "active",
        passwordHash,
      }
    });
    console.log(`✅ Created developer user: ${DEV_EMAIL}`);
  } else {
    console.log(`✅ Developer user already exists: ${DEV_EMAIL}`);
  }

  // 5. Assign Developer role to user
  await prisma.rbacUserRole.upsert({
    where: {
      userId_roleId_orgId: {
        userId: devUser.id,
        roleId: developerRole.id,
        orgId: devUser.orgId!,
      }
    },
    update: {},
    create: {
      userId: devUser.id,
      roleId: developerRole.id,
      orgId: devUser.orgId!,
    }
  });
  console.log("✅ Assigned Developer role to user");

  console.log("\n🎉 Developer setup complete!");
  console.log(`📧 Developer login: ${DEV_EMAIL}`);
  console.log(`🔑 Developer password: ${DEV_PASSWORD}`);
  console.log(`🔧 For DEV_USER_EMAIL bypass, add: DEV_USER_EMAIL=${DEV_EMAIL}`);
}

main()
  .catch((e) => {
    console.error("❌ Error setting up developer:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());