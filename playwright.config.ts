import { defineConfig, devices } from '@playwright/test';

/**
 * Mobile regression testing config.
 *
 * Two-tier model:
 *   - Smoke: tests/smoke.spec.ts — <60s, runs on every PR, blocks merge
 *   - Full:  entire tests/ folder × device matrix — nightly
 *
 * Customize: baseURL, device matrix, reporter, timeouts.
 */

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const IS_CI = !!process.env.CI;
const USE_BROWSERSTACK = !!process.env.BROWSERSTACK_USERNAME && !!process.env.BROWSERSTACK_ACCESS_KEY;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: IS_CI,
  retries: IS_CI ? 2 : 0,
  workers: IS_CI ? 4 : undefined,
  timeout: 30_000,
  expect: {
    timeout: 5_000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
      threshold: 0.2,
    },
  },
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    IS_CI ? ['github'] : ['null'],
  ].filter(Boolean) as any,
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },

  projects: [
    // ─── Core matrix — runs on every PR via smoke gate, full nightly ───
    {
      name: 'iPhone 14 Safari',
      use: { ...devices['iPhone 14'] },
    },
    {
      name: 'iPhone SE Safari (small viewport)',
      use: { ...devices['iPhone SE'] },
    },
    {
      name: 'iPhone 14 Pro Max Safari (large viewport)',
      use: { ...devices['iPhone 14 Pro Max'] },
    },
    {
      name: 'Pixel 7 Chrome',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'iPad Pro 11 Safari',
      use: { ...devices['iPad Pro 11'] },
    },

    // ─── Tier-2 matrix — nightly only ───
    // Uncomment when you have analytics showing users on these devices
    // {
    //   name: 'Galaxy S22 Chrome',
    //   use: { ...devices['Galaxy S9+'], userAgent: SAMSUNG_INTERNET_UA },
    // },
    // {
    //   name: 'iPhone 11 Safari (older iOS)',
    //   use: { ...devices['iPhone 11'] },
    // },
  ],

  // Optional: spin up your dev server before running locally
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !IS_CI,
  //   timeout: 120_000,
  // },
});
