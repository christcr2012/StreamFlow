import { Page, Locator } from '@playwright/test';

/**
 * Page Object for Provider Portal Dashboard
 */
export class ProviderDashboardPage {
  readonly page: Page;
  readonly header: Locator;
  readonly tenantsLink: Locator;
  readonly analyticsLink: Locator;
  readonly billingLink: Locator;
  readonly settingsLink: Locator;
  readonly federationLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.locator('header');
    this.tenantsLink = page.locator('a[href*="/tenants"]');
    this.analyticsLink = page.locator('a[href*="/analytics"]');
    this.billingLink = page.locator('a[href*="/billing"]');
    this.settingsLink = page.locator('a[href*="/settings"]');
    this.federationLink = page.locator('a[href*="/federation"]');
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async navigateToTenants() {
    await this.tenantsLink.click();
    await this.page.waitForURL(/\/tenants/);
  }

  async navigateToAnalytics() {
    await this.analyticsLink.click();
    await this.page.waitForURL(/\/analytics/);
  }

  async navigateToBilling() {
    await this.billingLink.click();
    await this.page.waitForURL(/\/billing/);
  }

  async navigateToFederation() {
    await this.federationLink.click();
    await this.page.waitForURL(/\/federation/);
  }
}

