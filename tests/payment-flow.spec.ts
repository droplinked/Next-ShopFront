import { test, expect } from '@playwright/test';
import { mockExternalServices } from '../helpers/network';
import { injectSession } from '../helpers/session';
import { injectMockWallet } from '../helpers/wallet-mock';
import { byTestId } from '../helpers/testid';

/**
 * Payment flow — Next-ShopFront cart → checkout, Stripe Elements, Apple Pay,
 * wallet/PayPal/Coinbase modals, post-redirect reconciliation.
 *
 * Critical: DO NOT execute real transactions. We assert UI INTENT — the
 * button renders, the modal opens, the iframe loads, post-return state
 * reconciles. The wallet / Stripe / PayPal / Coinbase layers are mocked
 * via helpers/network.ts.
 *
 * Routes covered:
 *   /[productId]  → PDP "Add to cart" entrypoint
 *   /checkout     → checkout shell (Stripe Elements iframe, PSP picker)
 *
 * Cart is a drawer/sheet (not a route) launched from the header. Specs
 * reference it through `cart-drawer` / `cart-checkout-cta` testids.
 * TODO(mobile-test): backfill these testids in the Phase 3 audit PR.
 */

const SAMPLE_PRODUCT_ID = process.env.SAMPLE_PRODUCT_ID ?? 'sample-product';
const PRODUCT_PATH = process.env.PRODUCT_PATH ?? `/${SAMPLE_PRODUCT_ID}`;
const CHECKOUT_PATH = process.env.CHECKOUT_PATH ?? '/checkout';

test.describe('Payment flow', () => {
  test.beforeEach(async ({ page }) => {
    await mockExternalServices(page);
    await injectSession(page);
    await injectMockWallet(page);
  });

  test('Apple Pay button renders on /checkout on iPhone profile', async ({ page, browserName, isMobile }) => {
    test.skip(browserName !== 'webkit', 'Apple Pay is iOS Safari only');
    test.skip(!isMobile, 'Apple Pay button only renders on mobile viewport');

    await page.goto(CHECKOUT_PATH);

    // The Stripe Apple Pay button mounts via iframe from js.stripe.com
    const stripeFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]').first();
    await expect(stripeFrame.locator('body')).toBeVisible({ timeout: 5_000 });
  });

  test('Checkout primary CTA stays above iOS Safari bottom bar (no z-index clip)', async ({ page }) => {
    await page.goto(CHECKOUT_PATH);
    const cta = byTestId(page, 'checkout-pay-cta');
    await expect(cta).toBeVisible();

    const isClipped = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="checkout-pay-cta"]');
      if (!el || !window.visualViewport) return false;
      const r = el.getBoundingClientRect();
      return r.bottom > window.visualViewport.height + window.visualViewport.offsetTop;
    });
    expect(isClipped, 'Checkout pay CTA is clipped under iOS Safari bottom bar').toBe(false);
  });

  test('Cart drawer opens from PDP and exposes a checkout CTA', async ({ page }) => {
    await page.goto(PRODUCT_PATH);
    await byTestId(page, 'add-to-cart').click();
    await byTestId(page, 'header-cart-trigger').click();

    const drawer = byTestId(page, 'cart-drawer');
    await expect(drawer).toBeVisible();

    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(overflow, 'page has horizontal overflow when cart drawer is open').toBe(false);

    const checkoutCta = byTestId(page, 'cart-checkout-cta');
    await expect(checkoutCta).toBeVisible();
  });

  test('Wallet modal opens without horizontal scroll on mobile viewport', async ({ page }) => {
    await page.goto(CHECKOUT_PATH);
    await byTestId(page, 'connect-wallet-button').click();

    const modal = byTestId(page, 'wallet-modal');
    await expect(modal).toBeVisible();

    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(overflow, 'page has horizontal overflow when wallet modal is open').toBe(false);

    const closeBtn = byTestId(page, 'wallet-modal-close');
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();
    await expect(modal).not.toBeVisible();
  });

  test('Wallet reconnects after visibility-change return (deep-link flow)', async ({ page }) => {
    await page.goto(CHECKOUT_PATH);
    await byTestId(page, 'connect-wallet-button').click();

    // Simulate user being deep-linked to wallet app and returning
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForTimeout(200); // intentional: wallet apps deep-link briefly
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // After return, wallet state should be reconnected (chip flipped to 0x...)
    await expect.poll(
      async () => await byTestId(page, 'wallet-connected-chip').isVisible(),
      { timeout: 5_000 },
    ).toBe(true);
  });
});
