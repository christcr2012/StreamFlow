// scripts/seed.cjs
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Create org if missing
  let org = await prisma.org.findFirst();
  if (!org) {
    org = await prisma.org.create({
      data: {
        name: 'Mountain Vista',
        featureFlags: {
          lsa: false,
          uplead: false,
          geoPriority: ['Sterling', 'Greeley'],
        },
      },
    });
  }

  // Owner user (from env or default)
  const ownerEmail = process.env.SEED_OWNER_EMAIL || 'owner@example.com';
  await prisma.user.upsert({
    where: { email: ownerEmail },
    update: {},
    create: {
      orgId: org.id,
      email: ownerEmail,
      role: 'OWNER',
      name: 'Owner',
    },
  });

  console.log('Seed complete. Org:', org.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
