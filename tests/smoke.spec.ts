import { test, expect } from '@playwright/test';
import { mockExternalServices } from '../helpers/network';

/**
 * Smoke suite — <60s wall-clock, runs on every PR via GitHub Action.
 * Blocks merge on failure. Covers critical-path "did the deploy break
 * everything" checks.
 *
 * Next-ShopFront route map (Next.js App Router, src/app/(routes)/):
 *   /               → src/app/page.tsx (storefront root)
 *   /home           → src/app/(routes)/home/page.tsx (home tab)
 *   /[productId]    → src/app/(routes)/[productId]/page.tsx (PDP)
 *   /checkout       → src/app/(routes)/checkout/page.tsx
 *   /orders         → src/app/(routes)/orders/page.tsx
 *
 * Cart is a drawer component, not a dedicated route — covered in
 * payment-flow.spec.ts via data-testid.
 *
 * TODO(mobile-test): wire the spec to seed/resolve a real product id from
 * the apiv3 fixture mock so smoke does not rely on production data.
 */

const SAMPLE_PRODUCT_ID = process.env.SAMPLE_PRODUCT_ID ?? 'sample-product';

const EXAMPLE_PATHS = [
  '/',
  '/home',
  `/${SAMPLE_PRODUCT_ID}`,
  '/checkout',
];

test.describe('Smoke @smoke', () => {
  test.beforeEach(async ({ page }) => {
    await mockExternalServices(page);
  });

  for (const path of EXAMPLE_PATHS) {
    test(`${path} loads without JS errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          // Ignore known third-party noise; tighten this list for your app
          const text = msg.text();
          if (text.includes('Failed to load resource') && text.includes('favicon')) return;
          errors.push(`console.error: ${text}`);
        }
      });

      const response = await page.goto(path);
      expect(response?.status(), `${path} returned non-200`).toBeLessThan(400);

      await page.waitForLoadState('domcontentloaded');
      // Give a brief moment for hydration + early-fire errors
      await page.waitForLoadState('networkidle').catch(() => {/* networkidle can race on SSE */});

      expect(errors, `unexpected errors on ${path}:\n${errors.join('\n')}`).toEqual([]);
    });
  }

  test('first paint is reasonable (under 3s on default network)', async ({ page }) => {
    const start = Date.now();
    await page.goto(EXAMPLE_PATHS[0]);
    await page.waitForLoadState('domcontentloaded');
    const elapsed = Date.now() - start;
    expect(elapsed, `first paint took ${elapsed}ms (budget: 3000ms)`).toBeLessThan(3000);
  });
});
