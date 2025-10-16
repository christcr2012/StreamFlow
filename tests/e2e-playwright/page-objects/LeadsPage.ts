import { Page, Locator } from '@playwright/test';

/**
 * Page Object for Leads management page (tenant-app)
 */
export class LeadsPage {
  readonly page: Page;
  readonly newLeadButton: Locator;
  readonly leadsTable: Locator;
  readonly searchInput: Locator;
  readonly filterDropdown: Locator;

  // Form fields
  readonly companyNameInput: Locator;
  readonly contactNameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newLeadButton = page.locator('button:has-text("New Lead")');
    this.leadsTable = page.locator('[data-testid="leads-table"]');
    this.searchInput = page.locator('input[placeholder*="Search"]');
    this.filterDropdown = page.locator('[data-testid="filter-dropdown"]');

    // Form fields
    this.companyNameInput = page.locator('input[name="companyName"]');
    this.contactNameInput = page.locator('input[name="contactName"]');
    this.emailInput = page.locator('input[name="email"]');
    this.phoneInput = page.locator('input[name="phone"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.cancelButton = page.locator('button:has-text("Cancel")');
  }

  async goto() {
    await this.page.goto('/app/(tenant)/leads');
  }

  async clickNewLead() {
    await this.newLeadButton.click();
  }

  async fillLeadForm(data: {
    companyName: string;
    contactName: string;
    email: string;
    phone?: string;
  }) {
    await this.companyNameInput.fill(data.companyName);
    await this.contactNameInput.fill(data.contactName);
    await this.emailInput.fill(data.email);
    if (data.phone) {
      await this.phoneInput.fill(data.phone);
    }
  }

  async submitForm() {
    await this.submitButton.click();
  }

  async createLead(data: {
    companyName: string;
    contactName: string;
    email: string;
    phone?: string;
  }) {
    await this.clickNewLead();
    await this.fillLeadForm(data);
    await this.submitForm();
    // Wait for form to close and table to update
    await this.page.waitForTimeout(1000);
  }

  async searchLeads(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500); // Debounce
  }

  async getLeadCount(): Promise<number> {
    const rows = await this.leadsTable.locator('tbody tr').count();
    return rows;
  }

  async clickLeadByName(companyName: string) {
    await this.page.locator(`tr:has-text("${companyName}")`).click();
  }
}

