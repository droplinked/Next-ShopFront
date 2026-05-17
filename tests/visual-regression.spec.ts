import { test, expect } from '@playwright/test';
import { mockExternalServices } from '../helpers/network';
import { injectSession } from '../helpers/session';

/**
 * Visual regression — screenshot-diff per (route × device).
 *
 * Last-line defense for layout breaks no semantic assertion would catch:
 *   - z-index battles
 *   - safe-area-inset issues on notched devices
 *   - font-loading-induced reflow
 *   - missing assets
 *
 * Baselines committed to repo; updating requires `npm run test:mobile:update-snapshots`
 * and human PR review.
 *
 * CUSTOMIZE: ROUTES list. Add app-specific waits before screenshot if your
 * page has animations or skeleton states.
 */

const ROUTES = [
  '/',
  // '/story/sample',
  // '/pricing',
  // '/listen',
];

test.describe('Visual regression', () => {
  test.beforeEach(async ({ page }) => {
    await mockExternalServices(page);
    await injectSession(page);
    // Disable animations so screenshots are deterministic
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          transition-duration: 0s !important;
          animation-delay: 0s !important;
          transition-delay: 0s !important;
        }
      `,
    });
  });

  for (const route of ROUTES) {
    test(`${route} matches baseline`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState('networkidle').catch(() => {/* SSE-OK */});

      // Wait for fonts to load to avoid FOUT-induced reflow
      await page.evaluate(() => document.fonts?.ready);

      await expect(page).toHaveScreenshot({
        fullPage: true,
        animations: 'disabled',
      });
    });
  }
});
