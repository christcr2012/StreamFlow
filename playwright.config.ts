import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration for Cortiware
 * 
 * Tests both tenant-app and provider-portal against local dev servers
 * or deployed environments (staging/production).
 */

export default defineConfig({
  testDir: './tests/e2e-playwright',
  
  // Maximum time one test can run
  timeout: 30 * 1000,
  
  // Test execution settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  
  // Shared settings for all projects
  use: {
    // Base URL for tests - can be overridden by environment variables
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    // Collect trace on first retry
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on failure
    video: 'retain-on-failure',
  },

  // Configure projects for different apps and browsers
  projects: [
    // Tenant App Tests - Chromium
    {
      name: 'tenant-app-chromium',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.TENANT_APP_URL || 'http://localhost:3000',
      },
      testMatch: /.*tenant-app.*\.spec\.ts/,
    },
    
    // Tenant App Tests - Firefox
    {
      name: 'tenant-app-firefox',
      use: {
        ...devices['Desktop Firefox'],
        baseURL: process.env.TENANT_APP_URL || 'http://localhost:3000',
      },
      testMatch: /.*tenant-app.*\.spec\.ts/,
    },
    
    // Tenant App Tests - Mobile Safari
    {
      name: 'tenant-app-mobile',
      use: {
        ...devices['iPhone 13'],
        baseURL: process.env.TENANT_APP_URL || 'http://localhost:3000',
      },
      testMatch: /.*tenant-app.*\.spec\.ts/,
    },
    
    // Provider Portal Tests - Chromium
    {
      name: 'provider-portal-chromium',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.PROVIDER_PORTAL_URL || 'http://localhost:3001',
      },
      testMatch: /.*provider-portal.*\.spec\.ts/,
    },
    
    // Provider Portal Tests - Firefox
    {
      name: 'provider-portal-firefox',
      use: {
        ...devices['Desktop Firefox'],
        baseURL: process.env.PROVIDER_PORTAL_URL || 'http://localhost:3001',
      },
      testMatch: /.*provider-portal.*\.spec\.ts/,
    },
  ],

  // Web server configuration for local development
  webServer: process.env.CI ? undefined : [
    {
      command: 'cd apps/tenant-app && npm run dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
    {
      command: 'cd apps/provider-portal && npm run dev',
      url: 'http://localhost:3001',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
  ],
});

