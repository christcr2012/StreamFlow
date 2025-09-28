#!/usr/bin/env tsx
// scripts/update-provider-passwords.ts

/**
 * 🔐 UPDATE PROVIDER ACCOUNT PASSWORDS
 * 
 * Updates both provider accounts to use the new password: Thrillicous01no
 */

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/passwords';

const prisma = new PrismaClient();

// New password
const NEW_PASSWORD = 'Thrillicous01no';
const PROVIDER_EMAIL = 'chris.tcr.2012@gmail.com';
const DEV_EMAIL = 'gametcr3@gmail.com';

async function main() {
  console.log('🔐 Updating Provider Account Passwords...\n');

  try {
    // Hash the new password
    const passwordHash = await hashPassword(NEW_PASSWORD);
    console.log('✅ Password hashed successfully');

    // Update Provider account
    const providerUpdate = await prisma.user.update({
      where: { email: PROVIDER_EMAIL },
      data: { passwordHash },
      select: {
        email: true,
        name: true,
        role: true,
        status: true
      }
    });

    console.log(`✅ Provider Account Updated: ${providerUpdate.email}`);
    console.log(`   Name: ${providerUpdate.name}`);
    console.log(`   Role: ${providerUpdate.role}`);
    console.log(`   Status: ${providerUpdate.status}`);

    // Update Dev account  
    const devUpdate = await prisma.user.update({
      where: { email: DEV_EMAIL },
      data: { passwordHash },
      select: {
        email: true,
        name: true,
        role: true,
        status: true
      }
    });

    console.log(`✅ Dev Account Updated: ${devUpdate.email}`);
    console.log(`   Name: ${devUpdate.name}`);
    console.log(`   Role: ${devUpdate.role}`);
    console.log(`   Status: ${devUpdate.status}`);

    console.log('\n🎉 Password Update Complete!');
    console.log('===============================');
    console.log(`✅ Provider Account: ${PROVIDER_EMAIL}`);
    console.log(`✅ Dev Account: ${DEV_EMAIL}`);
    console.log(`🔐 New Password: ${NEW_PASSWORD}`);
    console.log('\n🚀 Both accounts are ready for login!');

  } catch (error) {
    console.error('❌ Error updating passwords:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
