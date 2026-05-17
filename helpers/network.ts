import type { Page, Route } from '@playwright/test';

/**
 * Stub external APIs so tests are deterministic, fast, and don't cost money.
 *
 * Call once at test setup: `await mockExternalServices(page)`.
 * Customize the URL patterns + responses to match your app's external deps.
 */

export interface MockResponses {
  stripe?: any;
  paypal?: any;
  sentry?: any;
  analytics?: any;
  custom?: Array<{ url: string | RegExp; response: any; status?: number }>;
}

export async function mockExternalServices(
  page: Page,
  responses: MockResponses = {},
): Promise<void> {
  // ─── Stripe ───
  await page.route(/api\.stripe\.com/, async (route: Route) => {
    const body = responses.stripe ?? {
      id: 'pi_test_mock',
      status: 'requires_payment_method',
      client_secret: 'pi_test_mock_secret',
    };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });

  // ─── PayPal ───
  await page.route(/api[-.]paypal\.com|paypalobjects\.com/, async (route: Route) => {
    const body = responses.paypal ?? { ack: 'success' };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });

  // ─── Sentry ───
  // Drop event posts entirely — tests should NOT pollute Sentry quota.
  await page.route(/sentry\.io|ingest\.sentry\.io/, async (route: Route) => {
    await route.fulfill({ status: 200, body: '' });
  });

  // ─── Analytics (Vercel, GA, Mixpanel, PostHog, Segment) ───
  await page.route(
    /vitals\.vercel-(insights|analytics)\.com|google-analytics\.com|googletagmanager\.com|mixpanel\.com|posthog\.com|segment\.io/,
    async (route: Route) => {
      await route.fulfill({ status: 200, body: '' });
    },
  );

  // ─── Droplinked apiv3 backend (Next-ShopFront talks to /api/v1/**) ───
  // Production hosts: apiv3.droplinked.com / apiv3dev.droplinked.com.
  // Mock by default to a generic success envelope so smoke specs don't depend
  // on live backend availability. Per-spec overrides should be passed via
  // `responses.custom` to assert specific payloads (cart, product, shipping).
  await page.route(
    /(apiv3|apiv3dev)\.droplinked\.com\/api\/v1\//,
    async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, data: null }),
      });
    },
  );

  // ─── Coinbase Commerce ───
  // Wallet-connection lib may post to api.commerce.coinbase.com on checkout.
  await page.route(/api\.commerce\.coinbase\.com/, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { code: 'mock-coinbase-charge' } }),
    });
  });

  // ─── Next-ShopFront internal API routes ───
  // The Next.js app exposes `/api/cart/**`, `/api/checkout/**`,
  // `/api/checkout/stripe/**`, `/api/checkout/shipping-rates/**`. We
  // intentionally do NOT route these here — specs that need deterministic
  // cart/checkout payloads should add `responses.custom` overrides; otherwise
  // requests fall through to the local route handlers.

  // ─── Custom routes (project-specific) ───
  for (const custom of responses.custom ?? []) {
    await page.route(custom.url, async (route: Route) => {
      await route.fulfill({
        status: custom.status ?? 200,
        contentType: 'application/json',
        body: JSON.stringify(custom.response),
      });
    });
  }
}

/**
 * Throttle network to slow-3G — for performance-aware tests.
 *
 * Playwright doesn't expose network conditions directly on the page; use
 * CDP for Chromium-based projects. For WebKit, skip + document.
 */
export async function throttleSlow3G(page: Page): Promise<void> {
  const browserName = page.context().browser()?.browserType().name();
  if (browserName !== 'chromium') {
    console.warn('[throttle] slow-3G throttling only supported on chromium; skipping');
    return;
  }
  const client = await page.context().newCDPSession(page);
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: (500 * 1024) / 8,
    uploadThroughput: (500 * 1024) / 8,
    latency: 400,
  });
}

/**
 * Simulate offline mode (Service Worker testing).
 */
export async function goOffline(page: Page): Promise<void> {
  await page.context().setOffline(true);
}

export async function goOnline(page: Page): Promise<void> {
  await page.context().setOffline(false);
}
