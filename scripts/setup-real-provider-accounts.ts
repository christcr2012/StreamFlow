#!/usr/bin/env tsx
// scripts/setup-real-provider-accounts.ts

/**
 * 🏢 SETUP REAL PROVIDER ACCOUNTS
 * 
 * Properly configures the real-world provider accounts:
 * - chris.tcr.2012@gmail.com: PROVIDER role (platform owner, billing, client management)
 * - gametcr3@gmail.com: DEVELOPER role (development, testing, technical access)
 * 
 * These are NOT client-side accounts - they are provider-side platform accounts
 */

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/passwords';

const prisma = new PrismaClient();

const PASSWORD = 'Thrillicous01no';

async function main() {
  console.log('🏢 Setting up Real Provider Platform Accounts...\n');

  try {
    // Get or create the StreamFlow Platform organization (provider org)
    let providerOrg = await prisma.org.findFirst({
      where: { name: 'StreamFlow Platform' }
    });

    if (!providerOrg) {
      providerOrg = await prisma.org.create({
        data: {
          name: 'StreamFlow Platform',
          aiPlan: 'ELITE', // Provider gets elite features
          aiCreditBalance: 100000, // Generous credits for provider
          aiMonthlyBudgetCents: 10000000, // $100k monthly budget for provider
          settingsJson: {
            isProviderOrg: true,
            platformOwner: true,
            billingEnabled: true,
            federationEnabled: true
          }
        }
      });
      console.log('✅ Created StreamFlow Platform organization');
    } else {
      // Update existing org to ensure proper provider settings
      await prisma.org.update({
        where: { id: providerOrg.id },
        data: {
          aiPlan: 'ELITE',
          aiCreditBalance: 100000,
          aiMonthlyBudgetCents: 10000000,
          settingsJson: {
            isProviderOrg: true,
            platformOwner: true,
            billingEnabled: true,
            federationEnabled: true
          }
        }
      });
      console.log('✅ Updated StreamFlow Platform organization');
    }

    const passwordHash = await hashPassword(PASSWORD);

    // Setup PROVIDER account (Platform Owner)
    const providerUser = await prisma.user.upsert({
      where: { email: 'chris.tcr.2012@gmail.com' },
      update: {
        passwordHash,
        status: 'active',
        role: 'PROVIDER',
        name: 'Chris (Platform Owner)',
      },
      create: {
        email: 'chris.tcr.2012@gmail.com',
        name: 'Chris (Platform Owner)',
        role: 'PROVIDER',
        orgId: providerOrg.id,
        status: 'active',
        passwordHash,
      }
    });

    // Setup OWNER account (Platform Developer with full access)
    const devUser = await prisma.user.upsert({
      where: { email: 'gametcr3@gmail.com' },
      update: {
        passwordHash,
        status: 'active',
        role: 'OWNER',
        name: 'Chris (Platform Developer)',
      },
      create: {
        email: 'gametcr3@gmail.com',
        name: 'Chris (Platform Developer)',
        role: 'OWNER',
        orgId: providerOrg.id,
        status: 'active',
        passwordHash,
      }
    });

    console.log('\n🎉 Real Provider Accounts Setup Complete!');
    console.log('==========================================');
    console.log(`✅ Provider Account: ${providerUser.email}`);
    console.log(`   Name: ${providerUser.name}`);
    console.log(`   Role: ${providerUser.role} (Platform Owner)`);
    console.log(`   Access: Provider billing, client management, platform settings`);
    console.log('');
    console.log(`✅ Developer Account: ${devUser.email}`);
    console.log(`   Name: ${devUser.name}`);
    console.log(`   Role: ${devUser.role} (Platform Developer)`);
    console.log(`   Access: Development tools, testing, technical configuration`);
    console.log('');
    console.log(`🔐 Password: ${PASSWORD}`);
    console.log(`🏢 Organization: ${providerOrg.name} (${providerOrg.id})`);
    console.log('');
    console.log('🎯 ACCOUNT PURPOSES:');
    console.log('====================');
    console.log('PROVIDER (chris.tcr.2012@gmail.com):');
    console.log('  - Platform owner and business operator');
    console.log('  - Client billing and subscription management');
    console.log('  - Revenue analytics and provider dashboard');
    console.log('  - Client onboarding and support');
    console.log('');
    console.log('DEVELOPER (gametcr3@gmail.com):');
    console.log('  - Platform development and maintenance');
    console.log('  - Technical configuration and testing');
    console.log('  - System administration and debugging');
    console.log('  - Feature development and deployment');

  } catch (error) {
    console.error('❌ Error setting up provider accounts:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
