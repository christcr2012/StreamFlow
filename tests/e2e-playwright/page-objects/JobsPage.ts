import { Page, Locator } from '@playwright/test';

/**
 * Page Object for Jobs management page (tenant-app)
 */
export class JobsPage {
  readonly page: Page;
  readonly newJobButton: Locator;
  readonly jobsTable: Locator;
  readonly searchInput: Locator;
  readonly filterDropdown: Locator;

  // Form fields
  readonly customerSelect: Locator;
  readonly serviceTypeSelect: Locator;
  readonly scheduledDateInput: Locator;
  readonly notesTextarea: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newJobButton = page.locator('button:has-text("New Job")');
    this.jobsTable = page.locator('[data-testid="jobs-table"]');
    this.searchInput = page.locator('input[placeholder*="Search"]');
    this.filterDropdown = page.locator('[data-testid="filter-dropdown"]');

    // Form fields
    this.customerSelect = page.locator('select[name="customerId"]');
    this.serviceTypeSelect = page.locator('select[name="serviceType"]');
    this.scheduledDateInput = page.locator('input[name="scheduledDate"]');
    this.notesTextarea = page.locator('textarea[name="notes"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.cancelButton = page.locator('button:has-text("Cancel")');
  }

  async goto() {
    await this.page.goto('/app/(tenant)/jobs');
  }

  async clickNewJob() {
    await this.newJobButton.click();
  }

  async fillJobForm(data: {
    customerId: string;
    serviceType: string;
    scheduledDate: string;
    notes?: string;
  }) {
    await this.customerSelect.selectOption(data.customerId);
    await this.serviceTypeSelect.selectOption(data.serviceType);
    await this.scheduledDateInput.fill(data.scheduledDate);
    if (data.notes) {
      await this.notesTextarea.fill(data.notes);
    }
  }

  async submitForm() {
    await this.submitButton.click();
  }

  async createJob(data: {
    customerId: string;
    serviceType: string;
    scheduledDate: string;
    notes?: string;
  }) {
    await this.clickNewJob();
    await this.fillJobForm(data);
    await this.submitForm();
    await this.page.waitForTimeout(1000);
  }

  async getJobCount(): Promise<number> {
    const rows = await this.jobsTable.locator('tbody tr').count();
    return rows;
  }

  async clickJobByCustomer(customerName: string) {
    await this.page.locator(`tr:has-text("${customerName}")`).click();
  }
}

