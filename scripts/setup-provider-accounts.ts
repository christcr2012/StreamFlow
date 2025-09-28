#!/usr/bin/env tsx
// scripts/setup-provider-accounts.ts

/**
 * 🚀 STREAMFLOW PROVIDER ACCOUNT SETUP
 * 
 * Creates the permanent provider-side accounts for StreamFlow platform:
 * - chris.tcr.2012@gmail.com (Provider account)
 * - gametcr3@gmail.com (Dev account)
 * 
 * These accounts are for platform administration and should persist
 * through all development phases and into production.
 */

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/passwords';

const prisma = new PrismaClient();

// Provider account credentials
const PROVIDER_EMAIL = 'chris.tcr.2012@gmail.com';
const DEV_EMAIL = 'gametcr3@gmail.com';

// You'll need to set this password - use the same one you remember
const PROVIDER_PASSWORD = process.env.PROVIDER_PASSWORD || 'YourPasswordHere123!';

async function main() {
  console.log('🚀 Setting up StreamFlow Provider Accounts...\n');

  try {
    // Get or create the first organization
    let org = await prisma.org.findFirst();
    if (!org) {
      org = await prisma.org.create({
        data: {
          name: 'StreamFlow Platform',
          aiCreditBalance: 10000, // Generous credits for provider
        }
      });
      console.log('✅ Created StreamFlow Platform organization');
    }

    const passwordHash = await hashPassword(PROVIDER_PASSWORD);

    // Create/update Provider account
    const providerUser = await prisma.user.upsert({
      where: { email: PROVIDER_EMAIL },
      update: {
        passwordHash,
        status: 'active',
        role: 'OWNER', // Provider accounts are now OWNER role
        name: 'Chris (Provider)',
      },
      create: {
        email: PROVIDER_EMAIL,
        name: 'Chris (Provider)',
        role: 'OWNER', // Provider accounts are now OWNER role
        orgId: org.id,
        status: 'active',
        passwordHash,
      }
    });

    // Create/update Dev account  
    const devUser = await prisma.user.upsert({
      where: { email: DEV_EMAIL },
      update: {
        passwordHash,
        status: 'active',
        role: 'OWNER',
        name: 'Chris (Dev)',
      },
      create: {
        email: DEV_EMAIL,
        name: 'Chris (Dev)',
        role: 'OWNER',
        orgId: org.id,
        status: 'active',
        passwordHash,
      }
    });

    console.log('\n🎉 Provider Accounts Setup Complete!');
    console.log('=====================================');
    console.log(`✅ Provider Account: ${PROVIDER_EMAIL}`);
    console.log(`✅ Dev Account: ${DEV_EMAIL}`);
    console.log(`🔐 Password: ${PROVIDER_PASSWORD}`);
    console.log(`🏢 Organization: ${org.name} (${org.id})`);
    console.log('\n🚨 SECURITY NOTE: Change password after first login!');

  } catch (error) {
    console.error('❌ Error setting up provider accounts:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
