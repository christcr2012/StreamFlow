import { Page, Locator } from '@playwright/test';

/**
 * Page Object for Tenants management page (provider-portal)
 */
export class TenantsPage {
  readonly page: Page;
  readonly tenantsTable: Locator;
  readonly searchInput: Locator;
  readonly filterDropdown: Locator;
  readonly newTenantButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.tenantsTable = page.locator('[data-testid="tenants-table"]');
    this.searchInput = page.locator('input[placeholder*="Search"]');
    this.filterDropdown = page.locator('[data-testid="filter-dropdown"]');
    this.newTenantButton = page.locator('button:has-text("New Tenant")');
  }

  async goto() {
    await this.page.goto('/tenants');
  }

  async getTenantCount(): Promise<number> {
    const rows = await this.tenantsTable.locator('tbody tr').count();
    return rows;
  }

  async searchTenants(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500);
  }

  async clickTenantByName(tenantName: string) {
    await this.page.locator(`tr:has-text("${tenantName}")`).click();
  }

  async clickNewTenant() {
    await this.newTenantButton.click();
  }
}

