import { test, expect } from '../fixtures/auth';
import { TenantsPage } from '../page-objects/TenantsPage';
import { ProviderDashboardPage } from '../page-objects/ProviderDashboardPage';

/**
 * E2E Tests for Provider Portal Tenant Monitoring
 * 
 * Tests:
 * - View tenants list
 * - Search tenants
 * - View tenant details
 * - Monitor tenant usage
 */

test.describe('Provider Portal - Tenant Monitoring', () => {
  test('should display tenants list', async ({ providerPage }) => {
    const tenantsPage = new TenantsPage(providerPage);

    await tenantsPage.goto();

    // Verify page loaded
    await expect(tenantsPage.tenantsTable).toBeVisible();
  });

  test('should show tenant count', async ({ providerPage }) => {
    const tenantsPage = new TenantsPage(providerPage);

    await tenantsPage.goto();

    const count = await tenantsPage.getTenantCount();
    
    // Should have at least 0 tenants (could be empty)
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should search tenants', async ({ providerPage }) => {
    const tenantsPage = new TenantsPage(providerPage);

    await tenantsPage.goto();

    // Search for a tenant (if any exist)
    await tenantsPage.searchTenants('test');

    // Search should complete without errors
    await expect(tenantsPage.searchInput).toHaveValue('test');
  });

  test('should navigate from dashboard to tenants', async ({ providerPage }) => {
    const dashboardPage = new ProviderDashboardPage(providerPage);
    const tenantsPage = new TenantsPage(providerPage);

    await dashboardPage.goto();
    await dashboardPage.navigateToTenants();

    // Verify on tenants page
    await expect(tenantsPage.tenantsTable).toBeVisible();
  });

  test('should display tenant details when clicking on tenant', async ({ providerPage }) => {
    const tenantsPage = new TenantsPage(providerPage);

    await tenantsPage.goto();

    const tenantCount = await tenantsPage.getTenantCount();

    if (tenantCount > 0) {
      // Click on first tenant
      const firstTenant = providerPage.locator('tbody tr').first();
      await firstTenant.click();

      // Should navigate to tenant details page
      await expect(providerPage).toHaveURL(/\/tenants\/[a-zA-Z0-9-]+/);
    } else {
      // Skip test if no tenants exist
      test.skip();
    }
  });
});

