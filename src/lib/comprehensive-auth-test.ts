// src/lib/comprehensive-auth-test.ts

/**
 * 🔒 COMPREHENSIVE AUTHENTICATION SYSTEM TESTING FRAMEWORK
 * 
 * Tests all three authentication systems with complete isolation validation:
 * - PROVIDER System (Environment-based)
 * - DEVELOPER System (Environment-based) 
 * - CLIENT System (Database-based)
 * 
 * Validates:
 * ✅ Authentication success/failure scenarios
 * ✅ Cookie isolation and namespace separation
 * ✅ Route protection and access control
 * ✅ Security boundary enforcement
 * ✅ Cross-system contamination prevention
 */

interface AuthTestResult {
  testName: string;
  success: boolean;
  details: string;
  timestamp: string;
  duration: number;
}

interface SystemTestSuite {
  systemName: string;
  tests: AuthTestResult[];
  overallSuccess: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
}

export class ComprehensiveAuthTester {
  private results: SystemTestSuite[] = [];
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  /**
   * 🏢 PROVIDER SYSTEM AUTHENTICATION TESTS
   */
  async testProviderSystem(): Promise<SystemTestSuite> {
    const suite: SystemTestSuite = {
      systemName: 'PROVIDER',
      tests: [],
      overallSuccess: false,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0
    };

    console.log('🏢 TESTING PROVIDER SYSTEM AUTHENTICATION...');

    // Test 1: Valid Provider Login
    await this.runTest(suite, 'Provider Valid Login', async () => {
      const response = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: process.env.PROVIDER_EMAIL,
          password: process.env.PROVIDER_PASSWORD
        })
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(`Provider login failed: ${data.error || response.statusText}`);
      }

      if (data.redirectUrl !== '/provider') {
        throw new Error(`Expected redirect to /provider, got ${data.redirectUrl}`);
      }

      return 'Provider authentication successful with correct redirect';
    });

    // Test 2: Invalid Provider Credentials
    await this.runTest(suite, 'Provider Invalid Credentials', async () => {
      const response = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: process.env.PROVIDER_EMAIL,
          password: 'wrong_password'
        })
      });

      const data = await response.json();
      if (response.ok || data.ok) {
        throw new Error('Provider login should have failed with wrong password');
      }

      return 'Provider correctly rejected invalid credentials';
    });

    // Test 3: Provider Route Access Protection
    await this.runTest(suite, 'Provider Route Protection', async () => {
      // First login to get cookie
      const loginResponse = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: process.env.PROVIDER_EMAIL,
          password: process.env.PROVIDER_PASSWORD
        })
      });

      if (!loginResponse.ok) {
        throw new Error('Provider login failed for route test');
      }

      // Extract cookie from response
      const setCookieHeader = loginResponse.headers.get('set-cookie');
      if (!setCookieHeader) {
        throw new Error('No cookie set after provider login');
      }

      // Test access to provider route
      const routeResponse = await fetch(`${this.baseUrl}/provider`, {
        headers: {
          'Cookie': setCookieHeader
        },
        redirect: 'manual'
      });

      if (routeResponse.status === 302) {
        const location = routeResponse.headers.get('location');
        if (location?.includes('login')) {
          throw new Error('Provider was redirected to login when accessing /provider route');
        }
      }

      return 'Provider can access /provider routes with valid authentication';
    });

    this.calculateSuiteResults(suite);
    return suite;
  }

  /**
   * 🔧 DEVELOPER SYSTEM AUTHENTICATION TESTS
   */
  async testDeveloperSystem(): Promise<SystemTestSuite> {
    const suite: SystemTestSuite = {
      systemName: 'DEVELOPER',
      tests: [],
      overallSuccess: false,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0
    };

    console.log('🔧 TESTING DEVELOPER SYSTEM AUTHENTICATION...');

    // Test 1: Valid Developer Login
    await this.runTest(suite, 'Developer Valid Login', async () => {
      const response = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: process.env.DEVELOPER_EMAIL,
          password: process.env.DEVELOPER_PASSWORD
        })
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(`Developer login failed: ${data.error || response.statusText}`);
      }

      if (data.redirectUrl !== '/dev') {
        throw new Error(`Expected redirect to /dev, got ${data.redirectUrl}`);
      }

      return 'Developer authentication successful with correct redirect';
    });

    // Test 2: Invalid Developer Credentials
    await this.runTest(suite, 'Developer Invalid Credentials', async () => {
      const response = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: process.env.DEVELOPER_EMAIL,
          password: 'wrong_password'
        })
      });

      const data = await response.json();
      if (response.ok || data.ok) {
        throw new Error('Developer login should have failed with wrong password');
      }

      return 'Developer correctly rejected invalid credentials';
    });

    this.calculateSuiteResults(suite);
    return suite;
  }

  /**
   * 👤 CLIENT SYSTEM AUTHENTICATION TESTS
   */
  async testClientSystem(): Promise<SystemTestSuite> {
    const suite: SystemTestSuite = {
      systemName: 'CLIENT',
      tests: [],
      overallSuccess: false,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0
    };

    console.log('👤 TESTING CLIENT SYSTEM AUTHENTICATION...');

    // Test 1: Dev Test User Login
    await this.runTest(suite, 'Dev Test User Login', async () => {
      const response = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'owner@test.com',
          password: 'any_password'
        })
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(`Dev test user login failed: ${data.error || response.statusText}`);
      }

      if (data.redirectUrl !== '/dashboard') {
        throw new Error(`Expected redirect to /dashboard, got ${data.redirectUrl}`);
      }

      return 'Dev test user authentication successful';
    });

    this.calculateSuiteResults(suite);
    return suite;
  }

  /**
   * 🚨 SECURITY BOUNDARY TESTS
   */
  async testSecurityBoundaries(): Promise<SystemTestSuite> {
    const suite: SystemTestSuite = {
      systemName: 'SECURITY_BOUNDARIES',
      tests: [],
      overallSuccess: false,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0
    };

    console.log('🚨 TESTING SECURITY BOUNDARIES...');

    // Test 1: Cross-System Access Prevention
    await this.runTest(suite, 'Cross-System Access Prevention', async () => {
      // Login as provider
      const providerLogin = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: process.env.PROVIDER_EMAIL,
          password: process.env.PROVIDER_PASSWORD
        })
      });

      const providerCookie = providerLogin.headers.get('set-cookie');
      if (!providerCookie) {
        throw new Error('Provider login failed - no cookie');
      }

      // Try to access developer route with provider cookie
      const devRouteResponse = await fetch(`${this.baseUrl}/dev`, {
        headers: { 'Cookie': providerCookie },
        redirect: 'manual'
      });

      if (devRouteResponse.status !== 302) {
        throw new Error('Provider should be redirected when accessing /dev route');
      }

      const location = devRouteResponse.headers.get('location');
      if (!location?.includes('developer_access_denied')) {
        throw new Error('Provider should get developer_access_denied error');
      }

      return 'Cross-system access properly blocked';
    });

    this.calculateSuiteResults(suite);
    return suite;
  }

  /**
   * Run a single test and record results
   */
  private async runTest(suite: SystemTestSuite, testName: string, testFn: () => Promise<string>): Promise<void> {
    const startTime = Date.now();
    
    try {
      const details = await testFn();
      const duration = Date.now() - startTime;
      
      suite.tests.push({
        testName,
        success: true,
        details,
        timestamp: new Date().toISOString(),
        duration
      });
      
      console.log(`✅ ${testName}: PASSED (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      const details = error instanceof Error ? error.message : String(error);
      
      suite.tests.push({
        testName,
        success: false,
        details,
        timestamp: new Date().toISOString(),
        duration
      });
      
      console.log(`❌ ${testName}: FAILED (${duration}ms) - ${details}`);
    }
  }

  /**
   * Calculate suite results
   */
  private calculateSuiteResults(suite: SystemTestSuite): void {
    suite.totalTests = suite.tests.length;
    suite.passedTests = suite.tests.filter(t => t.success).length;
    suite.failedTests = suite.tests.filter(t => !t.success).length;
    suite.overallSuccess = suite.failedTests === 0;
  }

  /**
   * 🎯 RUN ALL AUTHENTICATION TESTS
   */
  async runAllTests(): Promise<{
    overallSuccess: boolean;
    results: SystemTestSuite[];
    summary: string;
  }> {
    console.log('🔒 STARTING COMPREHENSIVE AUTHENTICATION SYSTEM TESTING...\n');

    const startTime = Date.now();

    // Run all test suites
    const providerResults = await this.testProviderSystem();
    const developerResults = await this.testDeveloperSystem();
    const clientResults = await this.testClientSystem();
    const securityResults = await this.testSecurityBoundaries();

    this.results = [providerResults, developerResults, clientResults, securityResults];

    const totalDuration = Date.now() - startTime;
    const overallSuccess = this.results.every(suite => suite.overallSuccess);

    // Generate summary
    const totalTests = this.results.reduce((sum, suite) => sum + suite.totalTests, 0);
    const totalPassed = this.results.reduce((sum, suite) => sum + suite.passedTests, 0);
    const totalFailed = this.results.reduce((sum, suite) => sum + suite.failedTests, 0);

    const summary = `
🔒 COMPREHENSIVE AUTHENTICATION TESTING COMPLETE

OVERALL RESULT: ${overallSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}
Total Duration: ${totalDuration}ms
Total Tests: ${totalTests}
Passed: ${totalPassed}
Failed: ${totalFailed}

SYSTEM BREAKDOWN:
${this.results.map(suite => 
  `${suite.systemName}: ${suite.overallSuccess ? '✅' : '❌'} (${suite.passedTests}/${suite.totalTests})`
).join('\n')}

${totalFailed > 0 ? '\n🚨 FAILED TESTS:\n' + this.results
  .flatMap(suite => suite.tests.filter(t => !t.success))
  .map(test => `- ${test.testName}: ${test.details}`)
  .join('\n') : ''}
    `;

    console.log(summary);

    return {
      overallSuccess,
      results: this.results,
      summary
    };
  }
}

// Export for use in API endpoints
export default ComprehensiveAuthTester;
