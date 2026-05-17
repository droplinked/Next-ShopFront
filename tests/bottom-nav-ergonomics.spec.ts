import { test, expect } from '@playwright/test';
import { mockExternalServices } from '../helpers/network';
import { injectSession } from '../helpers/session';

/**
 * iOS Safari has a dynamic bottom address bar that appears/disappears on
 * scroll. UI anchored to viewport-bottom often ends up under it. This suite
 * asserts critical interactive elements stay reachable.
 *
 * CUSTOMIZE: ROUTES + testids for elements that anchor to bottom (CTAs,
 * sticky checkout buttons, floating action buttons, mini-players).
 */

const ROUTES_WITH_BOTTOM_ANCHORED_UI = [
  // { path: '/pricing', testIds: ['plus-tier-cta', 'pro-tier-cta'] },
  // { path: '/listen', testIds: ['mini-player'] },
];

test.describe('Bottom-nav ergonomics', () => {
  test.beforeEach(async ({ page }) => {
    await mockExternalServices(page);
    await injectSession(page);
  });

  for (const { path, testIds } of ROUTES_WITH_BOTTOM_ANCHORED_UI) {
    for (const id of testIds) {
      test(`${path}: ${id} stays above iOS Safari bottom bar`, async ({ page }) => {
        await page.goto(path);
        const el = page.locator(`[data-testid="${id}"]`);
        await expect(el).toBeVisible();

        const clipped = await page.evaluate((selector) => {
          const node = document.querySelector(selector);
          if (!node || !window.visualViewport) return false;
          const r = node.getBoundingClientRect();
          // visualViewport excludes the iOS bottom bar when present
          return r.bottom > window.visualViewport.height + window.visualViewport.offsetTop + 1;
        }, `[data-testid="${id}"]`);

        expect(clipped, `${id} on ${path} extends below the visual viewport`).toBe(false);
      });
    }
  }

  test('respects env(safe-area-inset-bottom) on notched devices', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'safe-area-inset is mobile-only');
    await page.goto('/');
    const safeAreaUsed = await page.evaluate(() => {
      // Look for any element that uses safe-area-inset in its computed padding/margin
      const all = document.querySelectorAll('*');
      for (const el of Array.from(all).slice(0, 200)) {
        const s = getComputedStyle(el as Element);
        if (
          s.paddingBottom.includes('safe-area-inset') ||
          s.marginBottom.includes('safe-area-inset') ||
          (s as any).getPropertyValue?.('padding-bottom')?.includes('env(')
        ) {
          return true;
        }
      }
      return false;
    });
    // This is a soft check — warns but doesn't fail if your app doesn't use it
    if (!safeAreaUsed) {
      console.warn('No element uses env(safe-area-inset-bottom); notched iPhones may show UI under home indicator');
    }
  });
});
