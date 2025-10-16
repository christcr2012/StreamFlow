import { test, expect } from '../fixtures/auth';
import { ProviderDashboardPage } from '../page-objects/ProviderDashboardPage';

/**
 * E2E Tests for Provider Portal Analytics & Observability
 * 
 * Tests:
 * - View analytics dashboard
 * - Monitor system metrics
 * - View usage statistics
 */

test.describe('Provider Portal - Analytics & Observability', () => {
  test('should display analytics page', async ({ providerPage }) => {
    const dashboardPage = new ProviderDashboardPage(providerPage);

    await dashboardPage.goto();
    await dashboardPage.navigateToAnalytics();

    // Verify on analytics page
    await expect(providerPage).toHaveURL(/\/analytics/);
  });

  test('should load analytics without errors', async ({ providerPage }) => {
    const consoleErrors: string[] = [];
    
    providerPage.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await providerPage.goto('/analytics');
    await providerPage.waitForLoadState('networkidle');

    // Verify no console errors
    expect(consoleErrors).toHaveLength(0);
  });

  test('should display usage metrics', async ({ providerPage }) => {
    await providerPage.goto('/analytics');

    // Look for common metric indicators
    const metricsContainer = providerPage.locator('[data-testid="metrics-container"]').or(
      providerPage.locator('text=/Total|Usage|Requests|API/')
    );

    const count = await metricsContainer.count();
    expect(count).toBeGreaterThan(0);
  });
});

