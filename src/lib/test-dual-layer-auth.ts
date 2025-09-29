// src/lib/test-dual-layer-auth.ts

/**
 * Comprehensive Test Suite for Dual-Layer Provider Authentication
 * 
 * Tests both normal DB-backed authentication and break-glass recovery mode
 * to ensure the system works correctly in all scenarios.
 */

import { authenticateProvider } from './provider-auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TestResult {
  testName: string;
  passed: boolean;
  details: string;
  error?: string;
}

export async function runDualLayerAuthTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  console.log('🧪 STARTING DUAL-LAYER AUTHENTICATION TESTS...\n');

  // Test 1: Break-glass authentication (should work immediately)
  try {
    console.log('🔧 Test 1: Break-glass environment authentication...');
    
    const breakGlassResult = await authenticateProvider({
      email: 'chris.tcr.2012@gmail.com',
      password: 'Thrillicious01no',
      ipAddress: '127.0.0.1',
      userAgent: 'Test-Agent/1.0'
    });

    if (breakGlassResult.success && breakGlassResult.mode === 'recovery') {
      results.push({
        testName: 'Break-glass Authentication',
        passed: true,
        details: `✅ Recovery mode authentication successful. User: ${breakGlassResult.user?.email}`
      });
      console.log('✅ Break-glass authentication PASSED\n');
    } else {
      results.push({
        testName: 'Break-glass Authentication',
        passed: false,
        details: `❌ Expected recovery mode success, got: ${JSON.stringify(breakGlassResult)}`
      });
      console.log('❌ Break-glass authentication FAILED\n');
    }
  } catch (error) {
    results.push({
      testName: 'Break-glass Authentication',
      passed: false,
      details: 'Exception during break-glass authentication',
      error: error instanceof Error ? error.message : String(error)
    });
    console.log('❌ Break-glass authentication FAILED with exception\n');
  }

  // Test 2: Invalid credentials (should fail)
  try {
    console.log('🔧 Test 2: Invalid credentials rejection...');
    
    const invalidResult = await authenticateProvider({
      email: 'invalid@example.com',
      password: 'wrongpassword',
      ipAddress: '127.0.0.1',
      userAgent: 'Test-Agent/1.0'
    });

    if (!invalidResult.success) {
      results.push({
        testName: 'Invalid Credentials Rejection',
        passed: true,
        details: '✅ Invalid credentials correctly rejected'
      });
      console.log('✅ Invalid credentials rejection PASSED\n');
    } else {
      results.push({
        testName: 'Invalid Credentials Rejection',
        passed: false,
        details: '❌ Invalid credentials were incorrectly accepted'
      });
      console.log('❌ Invalid credentials rejection FAILED\n');
    }
  } catch (error) {
    results.push({
      testName: 'Invalid Credentials Rejection',
      passed: false,
      details: 'Exception during invalid credentials test',
      error: error instanceof Error ? error.message : String(error)
    });
    console.log('❌ Invalid credentials test FAILED with exception\n');
  }

  // Test 3: Database connectivity test
  try {
    console.log('🔧 Test 3: Database connectivity check...');
    
    // Try to connect to database
    await prisma.$connect();
    const userCount = await prisma.user.count();
    
    results.push({
      testName: 'Database Connectivity',
      passed: true,
      details: `✅ Database connected successfully. User count: ${userCount}`
    });
    console.log('✅ Database connectivity PASSED\n');
  } catch (error) {
    results.push({
      testName: 'Database Connectivity',
      passed: false,
      details: 'Database connection failed',
      error: error instanceof Error ? error.message : String(error)
    });
    console.log('❌ Database connectivity FAILED\n');
  }

  // Test 4: Provider settings table existence
  try {
    console.log('🔧 Test 4: Provider settings table check...');
    
    // Check if ProviderSettings table exists and is accessible
    const providerCount = await prisma.providerSettings.count();
    
    results.push({
      testName: 'Provider Settings Table',
      passed: true,
      details: `✅ ProviderSettings table accessible. Record count: ${providerCount}`
    });
    console.log('✅ Provider settings table PASSED\n');
  } catch (error) {
    results.push({
      testName: 'Provider Settings Table',
      passed: false,
      details: 'ProviderSettings table not accessible',
      error: error instanceof Error ? error.message : String(error)
    });
    console.log('❌ Provider settings table FAILED\n');
  }

  // Test 5: Environment variables check
  try {
    console.log('🔧 Test 5: Environment variables validation...');
    
    const requiredEnvVars = [
      'PROVIDER_ADMIN_EMAIL',
      'PROVIDER_ADMIN_PASSWORD_HASH',
      'MASTER_ENC_KEY'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length === 0) {
      results.push({
        testName: 'Environment Variables',
        passed: true,
        details: '✅ All required environment variables are present'
      });
      console.log('✅ Environment variables PASSED\n');
    } else {
      results.push({
        testName: 'Environment Variables',
        passed: false,
        details: `❌ Missing environment variables: ${missingVars.join(', ')}`
      });
      console.log('❌ Environment variables FAILED\n');
    }
  } catch (error) {
    results.push({
      testName: 'Environment Variables',
      passed: false,
      details: 'Exception during environment variables check',
      error: error instanceof Error ? error.message : String(error)
    });
    console.log('❌ Environment variables test FAILED with exception\n');
  }

  // Test 6: Encryption utilities test
  try {
    console.log('🔧 Test 6: Encryption utilities validation...');
    
    const { encryptProviderData, decryptProviderData } = await import('./provider-encryption');
    
    const testData = 'test-encryption-data';
    const encrypted = encryptProviderData(testData);
    const decrypted = decryptProviderData(encrypted);
    
    if (decrypted === testData) {
      results.push({
        testName: 'Encryption Utilities',
        passed: true,
        details: '✅ Encryption/decryption working correctly'
      });
      console.log('✅ Encryption utilities PASSED\n');
    } else {
      results.push({
        testName: 'Encryption Utilities',
        passed: false,
        details: '❌ Encryption/decryption failed - data mismatch'
      });
      console.log('❌ Encryption utilities FAILED\n');
    }
  } catch (error) {
    results.push({
      testName: 'Encryption Utilities',
      passed: false,
      details: 'Exception during encryption utilities test',
      error: error instanceof Error ? error.message : String(error)
    });
    console.log('❌ Encryption utilities test FAILED with exception\n');
  }

  // Summary
  const passedTests = results.filter(r => r.passed).length;
  const totalTests = results.length;
  
  console.log('📊 TEST SUMMARY:');
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED! Dual-layer authentication system is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Please review the results above.');
  }

  return results;
}

// Export for use in API routes or other test runners
export default runDualLayerAuthTests;
