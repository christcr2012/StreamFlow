// src/lib/accountant-auth-test.ts

/**
 * 💰 ACCOUNTANT SYSTEM AUTHENTICATION TESTING
 * 
 * Comprehensive testing for the accountant authentication system
 * to identify and resolve the "accountant_access_denied" error.
 */

interface AccountantTestResult {
  testName: string;
  success: boolean;
  details: string;
  timestamp: string;
  duration: number;
}

export class AccountantAuthTester {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  /**
   * 🔍 COMPREHENSIVE ACCOUNTANT AUTHENTICATION DIAGNOSIS
   */
  async diagnoseAccountantAuth(): Promise<AccountantTestResult[]> {
    const results: AccountantTestResult[] = [];
    
    console.log('💰 DIAGNOSING ACCOUNTANT AUTHENTICATION SYSTEM...\n');

    // Test 1: Hardcoded Credentials Check
    await this.runTest(results, 'Hardcoded Credentials Check', async () => {
      const HARDCODED_ACCOUNTANT_EMAIL = 'accountant@streamflow.com';
      const HARDCODED_ACCOUNTANT_PASSWORD = 'Thrillicious01no';

      if (!HARDCODED_ACCOUNTANT_EMAIL) {
        throw new Error('Hardcoded accountant email is not set');
      }

      if (!HARDCODED_ACCOUNTANT_PASSWORD) {
        throw new Error('Hardcoded accountant password is not set');
      }

      return `Hardcoded credentials configured: ${HARDCODED_ACCOUNTANT_EMAIL} / [PASSWORD SET]`;
    });

    // Test 2: Login API Test
    await this.runTest(results, 'Accountant Login API Test', async () => {
      const response = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'accountant@streamflow.com',
          password: 'Thrillicious01no'
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Login failed: ${response.status} - ${data.error || response.statusText}`);
      }
      
      if (!data.ok) {
        throw new Error(`Login API returned error: ${data.error}`);
      }
      
      if (data.redirectUrl !== '/accountant') {
        throw new Error(`Expected redirect to /accountant, got ${data.redirectUrl}`);
      }
      
      return `Login successful, redirect to: ${data.redirectUrl}`;
    });

    // Test 3: Cookie Setting Test
    await this.runTest(results, 'Cookie Setting Test', async () => {
      const response = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'accountant@streamflow.com',
          password: 'Thrillicious01no'
        })
      });

      const setCookieHeader = response.headers.get('set-cookie');
      
      if (!setCookieHeader) {
        throw new Error('No Set-Cookie header found in login response');
      }
      
      if (!setCookieHeader.includes('ws_accountant=')) {
        throw new Error(`Expected ws_accountant cookie, got: ${setCookieHeader}`);
      }
      
      return `Cookie set correctly: ${setCookieHeader}`;
    });

    // Test 4: Route Access Test
    await this.runTest(results, 'Accountant Route Access Test', async () => {
      // First login to get cookie
      const loginResponse = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'accountant@streamflow.com',
          password: 'Thrillicious01no'
        })
      });

      if (!loginResponse.ok) {
        throw new Error('Login failed for route test');
      }

      const setCookieHeader = loginResponse.headers.get('set-cookie');
      if (!setCookieHeader) {
        throw new Error('No cookie set after login');
      }

      // Test access to accountant route
      const routeResponse = await fetch(`${this.baseUrl}/accountant`, {
        headers: {
          'Cookie': setCookieHeader
        },
        redirect: 'manual'
      });

      if (routeResponse.status === 302) {
        const location = routeResponse.headers.get('location');
        if (location?.includes('accountant_access_denied')) {
          throw new Error(`Accountant was denied access to /accountant route. Redirect: ${location}`);
        }
        if (location?.includes('login')) {
          throw new Error(`Accountant was redirected to login when accessing /accountant route. Redirect: ${location}`);
        }
      }

      if (routeResponse.status >= 400) {
        throw new Error(`Route access failed with status: ${routeResponse.status}`);
      }

      return `Route access successful. Status: ${routeResponse.status}`;
    });

    // Test 5: Middleware Cookie Decoding Test
    await this.runTest(results, 'Middleware Cookie Decoding Test', async () => {
      const testEmail = 'accountant@streamflow.com';
      const encodedEmail = encodeURIComponent(testEmail);
      const decodedEmail = decodeURIComponent(encodedEmail);
      
      if (decodedEmail !== testEmail) {
        throw new Error(`Cookie encoding/decoding mismatch: ${testEmail} -> ${encodedEmail} -> ${decodedEmail}`);
      }
      
      return `Cookie encoding/decoding works correctly: ${testEmail} <-> ${encodedEmail}`;
    });

    // Test 6: Environment Variable Case Sensitivity Test
    await this.runTest(results, 'Case Sensitivity Test', async () => {
      const envEmail = process.env.ACCOUNTANT_EMAIL?.toLowerCase();
      const testEmail = 'accountant@streamflow.com'.toLowerCase();
      
      if (envEmail !== testEmail) {
        throw new Error(`Email case mismatch: env=${envEmail}, test=${testEmail}`);
      }
      
      return `Case sensitivity check passed: ${envEmail} === ${testEmail}`;
    });

    // Test 7: API Dashboard Access Test
    await this.runTest(results, 'API Dashboard Access Test', async () => {
      // Login first
      const loginResponse = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'accountant@streamflow.com',
          password: 'Thrillicious01no'
        })
      });

      const setCookieHeader = loginResponse.headers.get('set-cookie');
      if (!setCookieHeader) {
        throw new Error('No cookie from login');
      }

      // Test API access
      const apiResponse = await fetch(`${this.baseUrl}/api/accountant/dashboard`, {
        headers: {
          'Cookie': setCookieHeader
        }
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({}));
        throw new Error(`API access failed: ${apiResponse.status} - ${errorData.error || apiResponse.statusText}`);
      }

      const data = await apiResponse.json();
      return `API access successful. User: ${data.user?.email}`;
    });

    return results;
  }

  /**
   * Run a single test and record results
   */
  private async runTest(results: AccountantTestResult[], testName: string, testFn: () => Promise<string>): Promise<void> {
    const startTime = Date.now();
    
    try {
      const details = await testFn();
      const duration = Date.now() - startTime;
      
      results.push({
        testName,
        success: true,
        details,
        timestamp: new Date().toISOString(),
        duration
      });
      
      console.log(`✅ ${testName}: PASSED (${duration}ms)`);
      console.log(`   ${details}\n`);
    } catch (error) {
      const duration = Date.now() - startTime;
      const details = error instanceof Error ? error.message : String(error);
      
      results.push({
        testName,
        success: false,
        details,
        timestamp: new Date().toISOString(),
        duration
      });
      
      console.log(`❌ ${testName}: FAILED (${duration}ms)`);
      console.log(`   ${details}\n`);
    }
  }

  /**
   * 🎯 RUN COMPLETE ACCOUNTANT DIAGNOSIS
   */
  async runDiagnosis(): Promise<{
    overallSuccess: boolean;
    results: AccountantTestResult[];
    summary: string;
    recommendations: string[];
  }> {
    console.log('💰 STARTING ACCOUNTANT AUTHENTICATION DIAGNOSIS...\n');

    const startTime = Date.now();
    const results = await this.diagnoseAccountantAuth();
    const totalDuration = Date.now() - startTime;

    const overallSuccess = results.every(test => test.success);
    const failedTests = results.filter(test => !test.success);

    const recommendations: string[] = [];

    // Generate recommendations based on failed tests
    failedTests.forEach(test => {
      if (test.testName.includes('Environment Variables')) {
        recommendations.push('🔧 Set ACCOUNTANT_EMAIL and ACCOUNTANT_PASSWORD in .env file');
      }
      if (test.testName.includes('Login API')) {
        recommendations.push('🔧 Check login API implementation for accountant authentication');
      }
      if (test.testName.includes('Cookie')) {
        recommendations.push('🔧 Fix cookie encoding/decoding in middleware');
      }
      if (test.testName.includes('Route Access')) {
        recommendations.push('🔧 Check middleware route protection for /accountant');
      }
      if (test.testName.includes('Case Sensitivity')) {
        recommendations.push('🔧 Fix case sensitivity in email comparison');
      }
      if (test.testName.includes('API Dashboard')) {
        recommendations.push('🔧 Check accountant API authentication');
      }
    });

    const summary = `
💰 ACCOUNTANT AUTHENTICATION DIAGNOSIS COMPLETE

OVERALL RESULT: ${overallSuccess ? '✅ ALL TESTS PASSED' : '❌ ISSUES FOUND'}
Total Duration: ${totalDuration}ms
Total Tests: ${results.length}
Passed: ${results.filter(t => t.success).length}
Failed: ${failedTests.length}

${failedTests.length > 0 ? '🚨 FAILED TESTS:\n' + failedTests
  .map(test => `- ${test.testName}: ${test.details}`)
  .join('\n') + '\n' : ''}

${recommendations.length > 0 ? '💡 RECOMMENDATIONS:\n' + recommendations.join('\n') : '✅ No issues found - accountant authentication should work correctly'}
    `;

    console.log(summary);

    return {
      overallSuccess,
      results,
      summary,
      recommendations
    };
  }
}

// Export for use in API endpoints
export default AccountantAuthTester;
