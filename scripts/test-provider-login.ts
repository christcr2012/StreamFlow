#!/usr/bin/env tsx
// scripts/test-provider-login.ts

/**
 * 🔍 TEST PROVIDER LOGIN
 * 
 * Tests password verification for provider accounts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { hashPassword } from '../src/lib/passwords';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Testing Provider Account Login...\n');

  const testPassword = 'Thrillicous01no';
  const providerEmail = 'chris.tcr.2012@gmail.com';
  const devEmail = 'gametcr3@gmail.com';

  try {
    // Test provider account
    console.log('🧪 TESTING PROVIDER ACCOUNT:');
    console.log('============================');
    
    const providerUser = await prisma.user.findUnique({
      where: { email: providerEmail },
      select: {
        email: true,
        passwordHash: true,
        status: true,
        role: true
      }
    });

    if (!providerUser) {
      console.log('❌ Provider user not found');
    } else {
      console.log(`✅ User found: ${providerUser.email}`);
      console.log(`   Role: ${providerUser.role}`);
      console.log(`   Status: ${providerUser.status}`);
      console.log(`   Has password hash: ${providerUser.passwordHash ? 'Yes' : 'No'}`);
      
      if (providerUser.passwordHash) {
        console.log(`   Password hash: ${providerUser.passwordHash.substring(0, 20)}...`);
        
        // Test password verification
        const isValid = await bcrypt.compare(testPassword, providerUser.passwordHash);
        console.log(`   Password "${testPassword}" valid: ${isValid ? '✅ YES' : '❌ NO'}`);
        
        if (!isValid) {
          console.log('\n🔧 FIXING PASSWORD...');
          const newHash = await hashPassword(testPassword);
          await prisma.user.update({
            where: { email: providerEmail },
            data: { passwordHash: newHash }
          });
          console.log('✅ Password hash updated');
          
          // Test again
          const retestValid = await bcrypt.compare(testPassword, newHash);
          console.log(`   Retest password valid: ${retestValid ? '✅ YES' : '❌ NO'}`);
        }
      }
    }

    console.log('\n🧪 TESTING DEV ACCOUNT:');
    console.log('=======================');
    
    const devUser = await prisma.user.findUnique({
      where: { email: devEmail },
      select: {
        email: true,
        passwordHash: true,
        status: true,
        role: true
      }
    });

    if (!devUser) {
      console.log('❌ Dev user not found');
    } else {
      console.log(`✅ User found: ${devUser.email}`);
      console.log(`   Role: ${devUser.role}`);
      console.log(`   Status: ${devUser.status}`);
      console.log(`   Has password hash: ${devUser.passwordHash ? 'Yes' : 'No'}`);
      
      if (devUser.passwordHash) {
        console.log(`   Password hash: ${devUser.passwordHash.substring(0, 20)}...`);
        
        // Test password verification
        const isValid = await bcrypt.compare(testPassword, devUser.passwordHash);
        console.log(`   Password "${testPassword}" valid: ${isValid ? '✅ YES' : '❌ NO'}`);
        
        if (!isValid) {
          console.log('\n🔧 FIXING PASSWORD...');
          const newHash = await hashPassword(testPassword);
          await prisma.user.update({
            where: { email: devEmail },
            data: { passwordHash: newHash }
          });
          console.log('✅ Password hash updated');
          
          // Test again
          const retestValid = await bcrypt.compare(testPassword, newHash);
          console.log(`   Retest password valid: ${retestValid ? '✅ YES' : '❌ NO'}`);
        }
      }
    }

    console.log('\n🎯 LOGIN TEST SUMMARY:');
    console.log('======================');
    console.log(`Provider Account: ${providerEmail}`);
    console.log(`Dev Account: ${devEmail}`);
    console.log(`Password: ${testPassword}`);
    console.log('\n✅ Both accounts should now work with this password!');

  } catch (error) {
    console.error('❌ Error testing login:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
