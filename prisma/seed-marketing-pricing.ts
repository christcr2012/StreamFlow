/**
 * Seed script for marketing pricing data
 * Run with: npx tsx prisma/seed-marketing-pricing.ts
 */

import { PrismaClient } from '@prisma/client-tenant';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding marketing pricing data...');

  // Delete existing pricing data
  await prisma.marketingPricingHistory.deleteMany({});
  await prisma.marketingPricingFeature.deleteMany({});
  await prisma.marketingPricingPlan.deleteMany({});

  console.log('✅ Cleared existing pricing data');

  // Create pricing plans with features
  const starter = await prisma.marketingPricingPlan.create({
    data: {
      name: 'Starter',
      slug: 'starter',
      price: 4900, // $49.00 in cents
      currency: 'USD',
      description: 'Perfect for small teams just getting started',
      cta: 'Start Free Trial',
      highlighted: false,
      active: true,
      sortOrder: 1,
      status: 'PUBLISHED',
      publishedAt: new Date(),
      features: {
        create: [
          { text: 'Up to 3 users', sortOrder: 1 },
          { text: 'Basic scheduling & dispatch', sortOrder: 2 },
          { text: 'Customer portal', sortOrder: 3 },
          { text: 'Mobile app access', sortOrder: 4 },
          { text: 'Email support', sortOrder: 5 },
          { text: 'Monthly invoicing', sortOrder: 6 },
        ],
      },
    },
  });

  console.log('✅ Created Starter plan');

  const professional = await prisma.marketingPricingPlan.create({
    data: {
      name: 'Professional',
      slug: 'professional',
      price: 19900, // $199.00 in cents
      currency: 'USD',
      description: 'For growing businesses with advanced needs',
      cta: 'Start Free Trial',
      highlighted: true, // MOST POPULAR
      active: true,
      sortOrder: 2,
      status: 'PUBLISHED',
      publishedAt: new Date(),
      features: {
        create: [
          { text: 'Unlimited users', sortOrder: 1 },
          { text: 'Advanced AI automation', sortOrder: 2 },
          { text: 'Custom branding', sortOrder: 3 },
          { text: 'API access', sortOrder: 4 },
          { text: 'Priority support', sortOrder: 5 },
          { text: 'Real-time analytics', sortOrder: 6 },
          { text: 'Custom integrations', sortOrder: 7 },
          { text: 'SSO & advanced security', sortOrder: 8 },
        ],
      },
    },
  });

  console.log('✅ Created Professional plan');

  const enterprise = await prisma.marketingPricingPlan.create({
    data: {
      name: 'Enterprise',
      slug: 'enterprise',
      price: null, // Custom pricing
      currency: 'USD',
      description: 'Custom solutions for large organizations',
      cta: 'Contact Sales',
      highlighted: false,
      active: true,
      sortOrder: 3,
      status: 'PUBLISHED',
      publishedAt: new Date(),
      features: {
        create: [
          { text: 'Everything in Professional', sortOrder: 1 },
          { text: 'Dedicated account manager', sortOrder: 2 },
          { text: 'Custom SLA', sortOrder: 3 },
          { text: 'On-premise deployment', sortOrder: 4 },
          { text: 'Advanced compliance', sortOrder: 5 },
          { text: 'Custom development', sortOrder: 6 },
          { text: 'Training & onboarding', sortOrder: 7 },
          { text: 'Phone support', sortOrder: 8 },
        ],
      },
    },
  });

  console.log('✅ Created Enterprise plan');

  // Create initial history entries
  await prisma.marketingPricingHistory.create({
    data: {
      planId: starter.id,
      action: 'CREATED',
      changes: {
        initial: true,
        price: 4900,
        features: 6,
      },
      changedBy: 'system',
      changedByEmail: 'system@cortiware.com',
      reason: 'Initial seed data',
    },
  });

  await prisma.marketingPricingHistory.create({
    data: {
      planId: professional.id,
      action: 'CREATED',
      changes: {
        initial: true,
        price: 19900,
        features: 8,
        highlighted: true,
      },
      changedBy: 'system',
      changedByEmail: 'system@cortiware.com',
      reason: 'Initial seed data',
    },
  });

  await prisma.marketingPricingHistory.create({
    data: {
      planId: enterprise.id,
      action: 'CREATED',
      changes: {
        initial: true,
        price: null,
        features: 8,
      },
      changedBy: 'system',
      changedByEmail: 'system@cortiware.com',
      reason: 'Initial seed data',
    },
  });

  console.log('✅ Created history entries');

  // Verify the data
  const plans = await prisma.marketingPricingPlan.findMany({
    include: {
      features: {
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: { sortOrder: 'asc' },
  });

  console.log('\n📊 Seeded pricing plans:');
  plans.forEach((plan) => {
    console.log(`\n  ${plan.name} (${plan.slug})`);
    console.log(`    Price: ${plan.price ? `$${plan.price / 100}` : 'Custom'}`);
    console.log(`    Status: ${plan.status}`);
    console.log(`    Highlighted: ${plan.highlighted}`);
    console.log(`    Features: ${plan.features.length}`);
  });

  console.log('\n✅ Marketing pricing seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding marketing pricing:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

