/**
 * Seed Test Tenants for Integration Testing
 *
 * Creates 5 test tenants with complete data for each vertical pack:
 * 1. Clean Sweep Services (Cleaning)
 * 2. Mile High Fence Co (Fencing)
 * 3. Rocky Mountain Portables (Port-a-John)
 * 4. Front Range Dumpsters (Roll-Off)
 * 5. Appliance Rentals Plus (Appliance Rental)
 *
 * Each tenant includes:
 * - Organization with subscription
 * - Owner user with credentials
 * - Sample leads (5 per tenant)
 * - Sample invoices (3 per tenant)
 * - API usage events
 * - Vertical-specific data
 */

import { PrismaClient } from "@prisma/client-tenant";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

interface TestTenant {
  name: string;
  vertical: string;
  email: string;
  password: string;
  themeVariant: string;
  primaryColor: string;
  accentColor: string;
}

const TEST_TENANTS: TestTenant[] = [
  {
    name: "Clean Sweep Services",
    vertical: "cleaning",
    email: "cleaning@test.cortiware.com",
    password: "Test123!",
    themeVariant: "premium-dark",
    primaryColor: "#00ff88",
    accentColor: "#3aa8ff",
  },
  {
    name: "Mile High Fence Co",
    vertical: "fencing",
    email: "fencing@test.cortiware.com",
    password: "Test123!",
    themeVariant: "premium-light",
    primaryColor: "#8b4513",
    accentColor: "#228b22",
  },
  {
    name: "Rocky Mountain Portables",
    vertical: "port-a-john",
    email: "portajohn@test.cortiware.com",
    password: "Test123!",
    themeVariant: "premium-dark",
    primaryColor: "#1e90ff",
    accentColor: "#ffa500",
  },
  {
    name: "Front Range Dumpsters",
    vertical: "roll-off",
    email: "rolloff@test.cortiware.com",
    password: "Test123!",
    themeVariant: "premium-light",
    primaryColor: "#ff6347",
    accentColor: "#4682b4",
  },
  {
    name: "Appliance Rentals Plus",
    vertical: "appliance-rental",
    email: "appliance@test.cortiware.com",
    password: "Test123!",
    themeVariant: "premium-dark",
    primaryColor: "#9370db",
    accentColor: "#20b2aa",
  },
];

async function seedTestTenants() {
  console.log("🌱 Starting test tenant seed...\n");

  for (const tenant of TEST_TENANTS) {
    console.log(`📦 Creating tenant: ${tenant.name} (${tenant.vertical})`);

    // Create organization
    const org = await prisma.org.create({
      data: {
        name: tenant.name,
        featureFlags: JSON.stringify({ testTenant: true }),
        themeSettings: JSON.stringify({
          variant: tenant.themeVariant,
          primaryColor: tenant.primaryColor,
          accentColor: tenant.accentColor,
        }),
        aiMonthlyBudgetCents: 5000,
        aiCreditBalance: 1000,
        aiPlan: "BASE",
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        subscriptionStatus: "active",
        subscriptionStartDate: new Date(),
        brandConfig: JSON.stringify({
          name: tenant.name,
          logoUrl: null,
        }),
        settingsJson: JSON.stringify({
          vertical: tenant.vertical,
          testAccount: true,
        }),
      },
    });

    console.log(`  ✅ Organization created: ${org.id}`);

    // Create owner user
    const passwordHash = await bcrypt.hash(tenant.password, 10);
    const user = await prisma.user.create({
      data: {
        orgId: org.id,
        email: tenant.email,
        name: `${tenant.name} Owner`,
        role: "OWNER",
        passwordHash,
        mustChangePassword: false,
        status: "active",
        isActive: true,
        isLocked: false,
        failedLoginAttempts: 0,
      },
    });

    console.log(`  ✅ Owner user created: ${user.email}`);

    // Create sample leads
    const leadSources = [
      "COLD",
      "HOT",
      "RFP",
      "MANUAL_NEW_CUSTOMER",
      "EMPLOYEE_REFERRAL",
    ];
    const leadStatuses = ["NEW", "CONVERTED"];

    for (let i = 0; i < 5; i++) {
      const lead = await prisma.lead.create({
        data: {
          orgId: org.id,
          publicId: `LEAD-${org.id.slice(0, 8)}-${i + 1}`,
          sourceType: leadSources[i % leadSources.length] as any,
          identityHash: `hash-${org.id}-${i}`,
          company: `Test Company ${i + 1}`,
          contactName: `Contact ${i + 1}`,
          email: `contact${i + 1}@testcompany.com`,
          phoneE164: `+1555000${1000 + i}`,
          serviceCode: tenant.vertical,
          zip: `8000${i}`,
          city: "Denver",
          state: "CO",
          address: `${100 + i * 100} Test St`,
          enrichmentJson: JSON.stringify({ source: "test-seed" }),
          aiScore: Math.floor(Math.random() * 100),
          scoreFactors: JSON.stringify({ testLead: true }),
          systemGenerated: false,
          status: leadStatuses[i % 2] as any,
          convertedAt: i % 2 === 1 ? new Date() : null,
        },
      });

      console.log(`  ✅ Lead created: ${lead.publicId}`);
    }

    // Create sample invoices
    for (let i = 0; i < 3; i++) {
      const invoice = await prisma.invoice.create({
        data: {
          orgId: org.id,
          amount: (1000 + i * 500).toString(),
          status: i === 0 ? "paid" : i === 1 ? "open" : "draft",
          issuedAt: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000),
          items: JSON.stringify([
            {
              description: `${tenant.vertical} service`,
              quantity: 1,
              unitPrice: 1000 + i * 500,
              total: 1000 + i * 500,
            },
          ]),
        },
      });

      console.log(`  ✅ Invoice created: ${invoice.id} (${invoice.status})`);
    }

    // Create AI usage events
    for (let i = 0; i < 10; i++) {
      await prisma.aiUsageEvent.create({
        data: {
          orgId: org.id,
          userId: user.id,
          feature: "lead_analysis",
          model: "gpt-4o-mini",
          tokensIn: Math.floor(Math.random() * 1000) + 100,
          tokensOut: Math.floor(Math.random() * 500) + 50,
          costUsd: (Math.random() * 0.01).toFixed(6),
          creditsUsed: Math.floor(Math.random() * 10) + 1,
          requestId: `req-${org.id}-${i}`,
          createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        },
      });
    }

    console.log(`  ✅ AI usage events created (10)`);

    // Create vertical-specific data for cleaning
    if (tenant.vertical === "cleaning") {
      // Create cleaning leads
      for (let i = 0; i < 3; i++) {
        const cleaningLead = await prisma.cleaningLead.create({
          data: {
            orgId: org.id,
            contactName: `Cleaning Contact ${i + 1}`,
            email: `cleaning${i + 1}@testclient.com`,
            phone: `+1555100${1000 + i}`,
            address: `${200 + i * 100} Clean St`,
            city: "Denver",
            state: "CO",
            zip: `8010${i}`,
            spaceType:
              i === 0
                ? "residential"
                : i === 1
                  ? "commercial"
                  : "post-construction",
            squareFeet: 1000 + i * 500,
            frequency: i === 0 ? "weekly" : i === 1 ? "bi-weekly" : "one-time",
            status: i === 0 ? "WON" : "NEW",
            aiEstimateJson: JSON.stringify({
              estimatedCost: 150 + i * 50,
              estimatedHours: 2 + i,
            }),
            aiTokensUsed: 500 + i * 100,
          },
        });

        console.log(`  ✅ Cleaning lead created: ${cleaningLead.id}`);
      }

      // Create checklist template
      const template = await prisma.cleaningChecklistTemplate.create({
        data: {
          orgId: org.id,
          name: "Standard Residential Checklist",
          spaceType: "residential",
          itemsJson: JSON.stringify([
            {
              category: "Kitchen",
              item: "Clean countertops",
              required: true,
              photo_required: false,
            },
            {
              category: "Kitchen",
              item: "Clean appliances",
              required: true,
              photo_required: true,
            },
            {
              category: "Bathroom",
              item: "Clean toilet",
              required: true,
              photo_required: false,
            },
            {
              category: "Bathroom",
              item: "Clean shower/tub",
              required: true,
              photo_required: true,
            },
            {
              category: "Living Areas",
              item: "Vacuum carpets",
              required: true,
              photo_required: false,
            },
            {
              category: "Living Areas",
              item: "Dust surfaces",
              required: true,
              photo_required: false,
            },
          ]),
          isDefault: true,
        },
      });

      console.log(`  ✅ Cleaning checklist template created: ${template.id}`);
    }

    console.log(`✅ Tenant ${tenant.name} seeded successfully!\n`);
  }

  console.log("🎉 All test tenants seeded successfully!");
  console.log("\n📋 Test Credentials:");
  TEST_TENANTS.forEach((t) => {
    console.log(`  ${t.name}: ${t.email} / [REDACTED]`); // Security: Don't log passwords
  });
}

async function main() {
  try {
    await seedTestTenants();
  } catch (error) {
    console.error("❌ Error seeding test tenants:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
