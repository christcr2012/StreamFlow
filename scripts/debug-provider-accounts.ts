#!/usr/bin/env tsx
// scripts/debug-provider-accounts.ts

/**
 * 🔍 DEBUG PROVIDER ACCOUNTS
 * 
 * Checks if provider accounts exist and are configured correctly
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Debugging Provider Account Access...\n');

  try {
    // Check if provider accounts exist
    const providerAccount = await prisma.user.findUnique({
      where: { email: 'chris.tcr.2012@gmail.com' },
      include: {
        org: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    const devAccount = await prisma.user.findUnique({
      where: { email: 'gametcr3@gmail.com' },
      include: {
        org: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    console.log('📊 ACCOUNT STATUS:');
    console.log('==================');
    
    if (providerAccount) {
      console.log('✅ Provider Account Found:');
      console.log(`   Email: ${providerAccount.email}`);
      console.log(`   Name: ${providerAccount.name}`);
      console.log(`   Role: ${providerAccount.role}`);
      console.log(`   Status: ${providerAccount.status}`);
      console.log(`   Org: ${providerAccount.org?.name} (${providerAccount.orgId})`);
      console.log(`   Has Password: ${providerAccount.passwordHash ? 'Yes' : 'No'}`);
    } else {
      console.log('❌ Provider Account NOT FOUND: chris.tcr.2012@gmail.com');
    }

    console.log('');

    if (devAccount) {
      console.log('✅ Dev Account Found:');
      console.log(`   Email: ${devAccount.email}`);
      console.log(`   Name: ${devAccount.name}`);
      console.log(`   Role: ${devAccount.role}`);
      console.log(`   Status: ${devAccount.status}`);
      console.log(`   Org: ${devAccount.org?.name} (${devAccount.orgId})`);
      console.log(`   Has Password: ${devAccount.passwordHash ? 'Yes' : 'No'}`);
    } else {
      console.log('❌ Dev Account NOT FOUND: gametcr3@gmail.com');
    }

    // Check all users in the system
    console.log('\n📋 ALL USERS IN SYSTEM:');
    console.log('========================');
    const allUsers = await prisma.user.findMany({
      select: {
        email: true,
        name: true,
        role: true,
        status: true,
        orgId: true
      },
      orderBy: { email: 'asc' }
    });

    if (allUsers.length === 0) {
      console.log('❌ NO USERS FOUND IN DATABASE');
    } else {
      allUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} (${user.role}) - ${user.status}`);
      });
    }

    // Check organizations
    console.log('\n🏢 ALL ORGANIZATIONS:');
    console.log('=====================');
    const allOrgs = await prisma.org.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            users: true
          }
        }
      }
    });

    if (allOrgs.length === 0) {
      console.log('❌ NO ORGANIZATIONS FOUND');
    } else {
      allOrgs.forEach((org, index) => {
        console.log(`${index + 1}. ${org.name} (${org.id}) - ${org._count.users} users`);
      });
    }

  } catch (error) {
    console.error('❌ Error debugging accounts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
