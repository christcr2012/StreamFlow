/**
 * 🧪 WEBHOOK SYSTEM TESTING SUITE
 * Comprehensive validation of the webhook notification system
 */

import { webhookSystem, WebhookEvents } from './webhook-system';
import { prisma as db } from './prisma';

interface WebhookTestResult {
  testName: string;
  passed: boolean;
  details: string;
  expectedBehavior: string;
  actualBehavior: string;
  duration?: number;
}

interface WebhookSystemTestSuite {
  endpointManagement: WebhookTestResult[];
  eventDelivery: WebhookTestResult[];
  retryLogic: WebhookTestResult[];
  securityValidation: WebhookTestResult[];
  performanceMetrics: WebhookTestResult[];
  overallStatus: 'PASS' | 'FAIL' | 'PARTIAL';
  criticalIssues: string[];
  recommendations: string[];
}

class WebhookSystemTester {
  private testOrgId = 'test-org-webhook-' + Date.now();
  private testWebhookUrl = 'https://webhook.site/test-endpoint';

  /**
   * Test webhook endpoint management
   */
  async testEndpointManagement(): Promise<WebhookTestResult[]> {
    const results: WebhookTestResult[] = [];

    try {
      // Test 1: Register webhook endpoint
      const startTime = Date.now();
      const webhook = await webhookSystem.registerWebhook(
        this.testOrgId,
        this.testWebhookUrl,
        [WebhookEvents.LEAD_CREATED, WebhookEvents.INVOICE_PAID]
      );
      const duration = Date.now() - startTime;

      results.push({
        testName: 'Webhook Registration',
        passed: !!webhook && webhook.url === this.testWebhookUrl,
        details: 'Should successfully register webhook endpoint with events',
        expectedBehavior: 'Webhook created with correct URL and events',
        actualBehavior: webhook ? `Created webhook ${webhook.id} with ${webhook.events.length} events` : 'Failed to create webhook',
        duration,
      });

      // Test 2: Validate webhook secret generation
      results.push({
        testName: 'Secret Generation',
        passed: !!webhook?.secret && webhook.secret.length >= 32,
        details: 'Should generate secure webhook secret',
        expectedBehavior: 'Secret generated with minimum 32 characters',
        actualBehavior: webhook?.secret ? `Secret length: ${webhook.secret.length}` : 'No secret generated',
      });

      // Test 3: Validate URL format checking
      try {
        await webhookSystem.registerWebhook(this.testOrgId, 'invalid-url', [WebhookEvents.LEAD_CREATED]);
        results.push({
          testName: 'URL Validation',
          passed: false,
          details: 'Should reject invalid URL formats',
          expectedBehavior: 'Error thrown for invalid URL',
          actualBehavior: 'Invalid URL was accepted (SECURITY ISSUE)',
        });
      } catch (error) {
        results.push({
          testName: 'URL Validation',
          passed: true,
          details: 'Should reject invalid URL formats',
          expectedBehavior: 'Error thrown for invalid URL',
          actualBehavior: `Correctly rejected invalid URL: ${(error as Error).message}`,
        });
      }

    } catch (error) {
      results.push({
        testName: 'Endpoint Management Error',
        passed: false,
        details: 'Endpoint management should work without errors',
        expectedBehavior: 'All operations complete successfully',
        actualBehavior: `Error: ${(error as Error).message}`,
      });
    }

    return results;
  }

  /**
   * Test event delivery system
   */
  async testEventDelivery(): Promise<WebhookTestResult[]> {
    const results: WebhookTestResult[] = [];

    try {
      // Register test webhook
      const webhook = await webhookSystem.registerWebhook(
        this.testOrgId,
        this.testWebhookUrl,
        [WebhookEvents.LEAD_CREATED]
      );

      // Test 1: Send webhook event
      const startTime = Date.now();
      await webhookSystem.sendWebhookEvent({
        type: WebhookEvents.LEAD_CREATED,
        data: {
          lead: {
            id: 'test-lead-123',
            name: 'Test Lead',
            email: 'test@example.com',
          },
        },
        orgId: this.testOrgId,
      });
      const duration = Date.now() - startTime;

      results.push({
        testName: 'Event Sending',
        passed: true, // If no error thrown, consider it passed
        details: 'Should send webhook event without errors',
        expectedBehavior: 'Event sent successfully',
        actualBehavior: `Event sent in ${duration}ms`,
        duration,
      });

      // Test 2: Verify event record creation
      const events = await db.webhookEvent.findMany({
        where: { orgId: this.testOrgId },
      });

      results.push({
        testName: 'Event Record Creation',
        passed: events.length > 0,
        details: 'Should create event record in database',
        expectedBehavior: 'Event record created',
        actualBehavior: `Found ${events.length} event records`,
      });

      // Test 3: Verify delivery record creation
      const deliveries = await db.webhookDelivery.findMany({
        where: {
          webhookEndpoint: { orgId: this.testOrgId },
        },
      });

      results.push({
        testName: 'Delivery Record Creation',
        passed: deliveries.length > 0,
        details: 'Should create delivery record for each endpoint',
        expectedBehavior: 'Delivery record created',
        actualBehavior: `Found ${deliveries.length} delivery records`,
      });

    } catch (error) {
      results.push({
        testName: 'Event Delivery Error',
        passed: false,
        details: 'Event delivery should work without errors',
        expectedBehavior: 'Events delivered successfully',
        actualBehavior: `Error: ${(error as Error).message}`,
      });
    }

    return results;
  }

  /**
   * Test retry logic and failure handling
   */
  async testRetryLogic(): Promise<WebhookTestResult[]> {
    const results: WebhookTestResult[] = [];

    try {
      // Register webhook with invalid URL to test retry logic
      const webhook = await webhookSystem.registerWebhook(
        this.testOrgId,
        'https://invalid-webhook-endpoint-that-does-not-exist.com/webhook',
        [WebhookEvents.LEAD_CREATED]
      );

      // Send event that will fail
      await webhookSystem.sendWebhookEvent({
        type: WebhookEvents.LEAD_CREATED,
        data: { test: true },
        orgId: this.testOrgId,
      });

      // Wait a moment for delivery attempt
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check delivery status
      const deliveries = await db.webhookDelivery.findMany({
        where: {
          webhookEndpoint: { orgId: this.testOrgId },
        },
      });

      const failedDelivery = deliveries.find(d => d.status === 'FAILED' || d.status === 'RETRYING');

      results.push({
        testName: 'Failure Handling',
        passed: !!failedDelivery,
        details: 'Should handle delivery failures gracefully',
        expectedBehavior: 'Failed delivery recorded with retry status',
        actualBehavior: failedDelivery ? `Delivery status: ${failedDelivery.status}` : 'No failed deliveries found',
      });

      // Test retry count tracking
      if (failedDelivery) {
        results.push({
          testName: 'Retry Count Tracking',
          passed: failedDelivery.attemptCount >= 1,
          details: 'Should track retry attempts',
          expectedBehavior: 'Attempt count incremented',
          actualBehavior: `Attempt count: ${failedDelivery.attemptCount}`,
        });
      }

    } catch (error) {
      results.push({
        testName: 'Retry Logic Error',
        passed: false,
        details: 'Retry logic should work without errors',
        expectedBehavior: 'Retry logic functions correctly',
        actualBehavior: `Error: ${(error as Error).message}`,
      });
    }

    return results;
  }

  /**
   * Test security validation
   */
  async testSecurityValidation(): Promise<WebhookTestResult[]> {
    const results: WebhookTestResult[] = [];

    try {
      // Test 1: HTTPS requirement
      try {
        await webhookSystem.registerWebhook(
          this.testOrgId,
          'http://insecure-webhook.com/endpoint',
          [WebhookEvents.LEAD_CREATED]
        );
        results.push({
          testName: 'HTTPS Requirement',
          passed: false,
          details: 'Should reject HTTP URLs (require HTTPS)',
          expectedBehavior: 'HTTP URL rejected',
          actualBehavior: 'HTTP URL was accepted (SECURITY VULNERABILITY)',
        });
      } catch (error) {
        results.push({
          testName: 'HTTPS Requirement',
          passed: true,
          details: 'Should reject HTTP URLs (require HTTPS)',
          expectedBehavior: 'HTTP URL rejected',
          actualBehavior: 'HTTP URL correctly rejected',
        });
      }

      // Test 2: Secret uniqueness
      const webhook1 = await webhookSystem.registerWebhook(
        this.testOrgId,
        'https://webhook1.example.com',
        [WebhookEvents.LEAD_CREATED]
      );
      const webhook2 = await webhookSystem.registerWebhook(
        this.testOrgId,
        'https://webhook2.example.com',
        [WebhookEvents.LEAD_CREATED]
      );

      results.push({
        testName: 'Secret Uniqueness',
        passed: webhook1.secret !== webhook2.secret,
        details: 'Each webhook should have unique secret',
        expectedBehavior: 'Different secrets generated',
        actualBehavior: webhook1.secret === webhook2.secret ? 'Same secret used (SECURITY ISSUE)' : 'Unique secrets generated',
      });

    } catch (error) {
      results.push({
        testName: 'Security Validation Error',
        passed: false,
        details: 'Security validation should work without errors',
        expectedBehavior: 'Security checks function correctly',
        actualBehavior: `Error: ${(error as Error).message}`,
      });
    }

    return results;
  }

  /**
   * Test performance metrics
   */
  async testPerformanceMetrics(): Promise<WebhookTestResult[]> {
    const results: WebhookTestResult[] = [];

    try {
      // Test webhook statistics
      const stats = await webhookSystem.getWebhookStats(this.testOrgId);

      results.push({
        testName: 'Statistics Generation',
        passed: typeof stats.totalEndpoints === 'number',
        details: 'Should generate webhook statistics',
        expectedBehavior: 'Statistics object with numeric values',
        actualBehavior: `Stats: ${JSON.stringify(stats)}`,
      });

      // Test performance under load (simplified)
      const startTime = Date.now();
      const promises = Array.from({ length: 10 }, (_, i) =>
        webhookSystem.sendWebhookEvent({
          type: WebhookEvents.LEAD_CREATED,
          data: { test: true, index: i },
          orgId: this.testOrgId,
        })
      );

      await Promise.all(promises);
      const duration = Date.now() - startTime;

      results.push({
        testName: 'Concurrent Event Handling',
        passed: duration < 5000, // Should handle 10 events in under 5 seconds
        details: 'Should handle multiple concurrent events efficiently',
        expectedBehavior: 'Multiple events processed quickly',
        actualBehavior: `Processed 10 events in ${duration}ms`,
        duration,
      });

    } catch (error) {
      results.push({
        testName: 'Performance Metrics Error',
        passed: false,
        details: 'Performance metrics should work without errors',
        expectedBehavior: 'Metrics generated successfully',
        actualBehavior: `Error: ${(error as Error).message}`,
      });
    }

    return results;
  }

  /**
   * Run complete webhook system test suite
   */
  async runCompleteTestSuite(): Promise<WebhookSystemTestSuite> {
    console.log('🧪 Running Webhook System Test Suite...');

    const endpointManagement = await this.testEndpointManagement();
    const eventDelivery = await this.testEventDelivery();
    const retryLogic = await this.testRetryLogic();
    const securityValidation = await this.testSecurityValidation();
    const performanceMetrics = await this.testPerformanceMetrics();

    const allTests = [...endpointManagement, ...eventDelivery, ...retryLogic, ...securityValidation, ...performanceMetrics];
    const passedTests = allTests.filter(test => test.passed);
    const failedTests = allTests.filter(test => !test.passed);

    const overallStatus: 'PASS' | 'FAIL' | 'PARTIAL' = 
      failedTests.length === 0 ? 'PASS' :
      passedTests.length === 0 ? 'FAIL' : 'PARTIAL';

    const criticalIssues = failedTests
      .filter(test => test.actualBehavior.includes('SECURITY') || test.testName.includes('Critical'))
      .map(test => `${test.testName}: ${test.actualBehavior}`);

    const recommendations = [];
    if (failedTests.some(test => test.testName.includes('Security'))) {
      recommendations.push('Review and fix security validation issues');
    }
    if (failedTests.some(test => test.testName.includes('Performance'))) {
      recommendations.push('Optimize webhook delivery performance');
    }
    if (failedTests.some(test => test.testName.includes('Retry'))) {
      recommendations.push('Improve retry logic and failure handling');
    }

    // Cleanup test data
    await this.cleanup();

    return {
      endpointManagement,
      eventDelivery,
      retryLogic,
      securityValidation,
      performanceMetrics,
      overallStatus,
      criticalIssues,
      recommendations,
    };
  }

  /**
   * Cleanup test data
   */
  private async cleanup(): Promise<void> {
    try {
      await db.webhookDelivery.deleteMany({
        where: {
          webhookEndpoint: { orgId: this.testOrgId },
        },
      });

      await db.webhookEvent.deleteMany({
        where: { orgId: this.testOrgId },
      });

      await db.webhookEndpoint.deleteMany({
        where: { orgId: this.testOrgId },
      });
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

// Export test runner
export const webhookSystemTester = new WebhookSystemTester();
export type { WebhookSystemTestSuite, WebhookTestResult };
