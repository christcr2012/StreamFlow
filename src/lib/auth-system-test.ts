/**
 * 🧪 AUTHENTICATION SUBSYSTEM TESTING
 * Comprehensive validation of the three-tier authentication system
 */

import type { NextApiRequest } from 'next';
import { getEmailFromReq, getProviderEmailFromReq, getDeveloperEmailFromReq } from './rbac';
import { authenticateProvider } from './provider-auth';
import { authenticateDeveloper } from './developer-auth';

interface TestResult {
  testName: string;
  passed: boolean;
  details: string;
  expectedBehavior: string;
  actualBehavior: string;
}

interface AuthSystemTestSuite {
  cookieIsolation: TestResult[];
  authenticationFlow: TestResult[];
  securityViolationPrevention: TestResult[];
  systemIntegrity: TestResult[];
  overallStatus: 'PASS' | 'FAIL' | 'PARTIAL';
  criticalIssues: string[];
  recommendations: string[];
}

class AuthSystemTester {
  /**
   * Create mock request with specific cookies
   */
  private createMockRequest(cookies: Record<string, string>): NextApiRequest {
    return {
      cookies,
      headers: {},
      method: 'GET',
      url: '/',
      query: {},
      body: {}
    } as NextApiRequest;
  }

  /**
   * Test cookie isolation between systems
   */
  async testCookieIsolation(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // Test 1: Client cookie should only work for client system
    const clientReq = this.createMockRequest({ ws_user: 'client@test.com' });
    const clientEmail = getEmailFromReq(clientReq);
    const providerEmailFromClient = getProviderEmailFromReq(clientReq);
    const developerEmailFromClient = getDeveloperEmailFromReq(clientReq);

    results.push({
      testName: 'Client Cookie Isolation',
      passed: clientEmail === 'client@test.com' && !providerEmailFromClient && !developerEmailFromClient,
      details: 'Client cookie should only be readable by client auth functions',
      expectedBehavior: 'Client: client@test.com, Provider: null, Developer: null',
      actualBehavior: `Client: ${clientEmail}, Provider: ${providerEmailFromClient}, Developer: ${developerEmailFromClient}`
    });

    // Test 2: Provider cookie should only work for provider system
    const providerReq = this.createMockRequest({ ws_provider: 'chris.tcr.2012@gmail.com' });
    const clientEmailFromProvider = getEmailFromReq(providerReq);
    const providerEmail = getProviderEmailFromReq(providerReq);
    const developerEmailFromProvider = getDeveloperEmailFromReq(providerReq);

    results.push({
      testName: 'Provider Cookie Isolation',
      passed: !clientEmailFromProvider && providerEmail === 'chris.tcr.2012@gmail.com' && !developerEmailFromProvider,
      details: 'Provider cookie should only be readable by provider auth functions',
      expectedBehavior: 'Client: null, Provider: chris.tcr.2012@gmail.com, Developer: null',
      actualBehavior: `Client: ${clientEmailFromProvider}, Provider: ${providerEmail}, Developer: ${developerEmailFromProvider}`
    });

    // Test 3: Developer cookie should only work for developer system
    const developerReq = this.createMockRequest({ ws_developer: 'gametcr3@gmail.com' });
    const clientEmailFromDeveloper = getEmailFromReq(developerReq);
    const providerEmailFromDeveloper = getProviderEmailFromReq(developerReq);
    const developerEmail = getDeveloperEmailFromReq(developerReq);

    results.push({
      testName: 'Developer Cookie Isolation',
      passed: !clientEmailFromDeveloper && !providerEmailFromDeveloper && developerEmail === 'gametcr3@gmail.com',
      details: 'Developer cookie should only be readable by developer auth functions',
      expectedBehavior: 'Client: null, Provider: null, Developer: gametcr3@gmail.com',
      actualBehavior: `Client: ${clientEmailFromDeveloper}, Provider: ${providerEmailFromDeveloper}, Developer: ${developerEmail}`
    });

    // Test 4: Cross-contamination prevention
    const mixedReq = this.createMockRequest({
      ws_user: 'client@test.com',
      ws_provider: 'chris.tcr.2012@gmail.com',
      ws_developer: 'gametcr3@gmail.com'
    });

    const mixedClient = getEmailFromReq(mixedReq);
    const mixedProvider = getProviderEmailFromReq(mixedReq);
    const mixedDeveloper = getDeveloperEmailFromReq(mixedReq);

    results.push({
      testName: 'Cross-Contamination Prevention',
      passed: mixedClient === 'client@test.com' && mixedProvider === 'chris.tcr.2012@gmail.com' && mixedDeveloper === 'gametcr3@gmail.com',
      details: 'Each auth function should only read its specific cookie even when multiple are present',
      expectedBehavior: 'Each system reads only its own cookie',
      actualBehavior: `Client: ${mixedClient}, Provider: ${mixedProvider}, Developer: ${mixedDeveloper}`
    });

    return results;
  }

  /**
   * Test authentication flow for each system
   */
  async testAuthenticationFlow(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // Test Provider Authentication
    const providerReq = this.createMockRequest({ ws_provider: process.env.PROVIDER_EMAIL || 'chris.tcr.2012@gmail.com' });
    const providerUser = await authenticateProvider(providerReq);

    results.push({
      testName: 'Provider Authentication',
      passed: !!providerUser && providerUser.email === (process.env.PROVIDER_EMAIL || 'chris.tcr.2012@gmail.com'),
      details: 'Provider authentication should work with correct provider cookie',
      expectedBehavior: 'Provider user object returned with correct email',
      actualBehavior: providerUser ? `User: ${providerUser.email}` : 'Authentication failed'
    });

    // Test Developer Authentication
    const developerReq = this.createMockRequest({ ws_developer: process.env.DEVELOPER_EMAIL || 'gametcr3@gmail.com' });
    const developerUser = await authenticateDeveloper(developerReq);

    results.push({
      testName: 'Developer Authentication',
      passed: !!developerUser && developerUser.email === (process.env.DEVELOPER_EMAIL || 'gametcr3@gmail.com'),
      details: 'Developer authentication should work with correct developer cookie',
      expectedBehavior: 'Developer user object returned with correct email',
      actualBehavior: developerUser ? `User: ${developerUser.email}` : 'Authentication failed'
    });

    // Test Cross-System Authentication Rejection
    const providerWithClientCookie = this.createMockRequest({ ws_user: 'client@test.com' });
    const providerUserFromClient = await authenticateProvider(providerWithClientCookie);

    results.push({
      testName: 'Cross-System Authentication Rejection',
      passed: !providerUserFromClient,
      details: 'Provider authentication should fail when only client cookie is present',
      expectedBehavior: 'Authentication fails (null returned)',
      actualBehavior: providerUserFromClient ? 'Authentication succeeded (SECURITY VIOLATION!)' : 'Authentication failed (correct)'
    });

    return results;
  }

  /**
   * Test security violation prevention
   */
  async testSecurityViolationPrevention(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // Test 1: Wrong email in provider cookie
    const wrongProviderReq = this.createMockRequest({ ws_provider: 'hacker@evil.com' });
    const wrongProviderUser = await authenticateProvider(wrongProviderReq);

    results.push({
      testName: 'Invalid Provider Email Rejection',
      passed: !wrongProviderUser,
      details: 'Provider authentication should fail with incorrect email in provider cookie',
      expectedBehavior: 'Authentication fails',
      actualBehavior: wrongProviderUser ? 'Authentication succeeded (SECURITY VIOLATION!)' : 'Authentication failed (correct)'
    });

    // Test 2: Wrong email in developer cookie
    const wrongDeveloperReq = this.createMockRequest({ ws_developer: 'hacker@evil.com' });
    const wrongDeveloperUser = await authenticateDeveloper(wrongDeveloperReq);

    results.push({
      testName: 'Invalid Developer Email Rejection',
      passed: !wrongDeveloperUser,
      details: 'Developer authentication should fail with incorrect email in developer cookie',
      expectedBehavior: 'Authentication fails',
      actualBehavior: wrongDeveloperUser ? 'Authentication succeeded (SECURITY VIOLATION!)' : 'Authentication failed (correct)'
    });

    return results;
  }

  /**
   * Test overall system integrity
   */
  async testSystemIntegrity(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // Test environment configuration
    const providerConfigured = !!(process.env.PROVIDER_EMAIL && process.env.PROVIDER_PASSWORD);
    const developerConfigured = !!(process.env.DEVELOPER_EMAIL && process.env.DEVELOPER_PASSWORD);

    results.push({
      testName: 'Environment Configuration',
      passed: providerConfigured && developerConfigured,
      details: 'Provider and developer credentials should be configured in environment',
      expectedBehavior: 'Both provider and developer credentials configured',
      actualBehavior: `Provider: ${providerConfigured ? 'configured' : 'missing'}, Developer: ${developerConfigured ? 'configured' : 'missing'}`
    });

    return results;
  }

  /**
   * Run complete authentication system test suite
   */
  async runCompleteTestSuite(): Promise<AuthSystemTestSuite> {
    console.log('🧪 Running Authentication System Test Suite...');

    const cookieIsolation = await this.testCookieIsolation();
    const authenticationFlow = await this.testAuthenticationFlow();
    const securityViolationPrevention = await this.testSecurityViolationPrevention();
    const systemIntegrity = await this.testSystemIntegrity();

    const allTests = [...cookieIsolation, ...authenticationFlow, ...securityViolationPrevention, ...systemIntegrity];
    const passedTests = allTests.filter(test => test.passed);
    const failedTests = allTests.filter(test => !test.passed);

    const overallStatus: 'PASS' | 'FAIL' | 'PARTIAL' = 
      failedTests.length === 0 ? 'PASS' :
      passedTests.length === 0 ? 'FAIL' : 'PARTIAL';

    const criticalIssues = failedTests
      .filter(test => test.testName.includes('Security') || test.testName.includes('Cross'))
      .map(test => `${test.testName}: ${test.actualBehavior}`);

    const recommendations = [];
    if (failedTests.some(test => test.testName.includes('Configuration'))) {
      recommendations.push('Configure missing environment variables for provider/developer credentials');
    }
    if (failedTests.some(test => test.testName.includes('Isolation'))) {
      recommendations.push('Fix cookie isolation - systems are reading wrong cookies');
    }
    if (failedTests.some(test => test.testName.includes('Authentication'))) {
      recommendations.push('Fix authentication flow - users not being authenticated correctly');
    }

    return {
      cookieIsolation,
      authenticationFlow,
      securityViolationPrevention,
      systemIntegrity,
      overallStatus,
      criticalIssues,
      recommendations
    };
  }
}

// Export test runner
export const authSystemTester = new AuthSystemTester();
export type { AuthSystemTestSuite, TestResult };
