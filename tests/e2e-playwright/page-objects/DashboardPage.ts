import { Page, Locator } from '@playwright/test';

/**
 * Page Object for Dashboard pages (tenant-app)
 */
export class DashboardPage {
  readonly page: Page;
  readonly header: Locator;
  readonly userMenu: Locator;
  readonly leadsLink: Locator;
  readonly jobsLink: Locator;
  readonly customersLink: Locator;
  readonly walletLink: Locator;
  readonly settingsLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.locator('header');
    this.userMenu = page.locator('[data-testid="user-menu"]');
    this.leadsLink = page.locator('a[href*="/leads"]');
    this.jobsLink = page.locator('a[href*="/jobs"]');
    this.customersLink = page.locator('a[href*="/customers"]');
    this.walletLink = page.locator('a[href*="/wallet"]');
    this.settingsLink = page.locator('a[href*="/settings"]');
  }

  async goto() {
    await this.page.goto('/app/(tenant)/dashboard');
  }

  async navigateToLeads() {
    await this.leadsLink.click();
    await this.page.waitForURL(/\/leads/);
  }

  async navigateToJobs() {
    await this.jobsLink.click();
    await this.page.waitForURL(/\/jobs/);
  }

  async navigateToCustomers() {
    await this.customersLink.click();
    await this.page.waitForURL(/\/customers/);
  }

  async navigateToWallet() {
    await this.walletLink.click();
    await this.page.waitForURL(/\/wallet/);
  }

  async navigateToSettings() {
    await this.settingsLink.click();
    await this.page.waitForURL(/\/settings/);
  }

  async getUserName(): Promise<string> {
    const userNameElement = this.page.locator('[data-testid="user-name"]');
    return await userNameElement.textContent() || '';
  }
}

