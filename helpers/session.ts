import type { Page } from '@playwright/test';

/**
 * Next-ShopFront note:
 * TODO(mobile-test): identify the canonical auth/session contract for the
 * storefront. Audit found NO `localStorage.setItem` calls — only a single
 * `localStorage.clear()` on 401 in `src/services/fetchConfig.ts`. The
 * storefront authenticates outbound requests via the `x-shop-id` header
 * sourced from `API_KEY` (build-time env). User identity, if any, likely
 * arrives via Droplinked apiv3 cookie or a wallet-connection state managed
 * by `@droplinked/wallet-connection`. Confirm the contract before relying
 * on `injectSession` in specs; until then, anonymous storefront flows
 * should NOT call this helper and should treat the suite as unauthenticated.
 *
 * Inject auth state into the page BEFORE any user code runs.
 *
 * Don't authenticate via UI flow — too slow + leaks creds. Set state
 * directly via addInitScript so localStorage is populated by the time
 * the page hydrates.
 *
 * Customize the storage key + shape to match your app's session contract.
 */

export interface MockSession {
  token: string;
  userId: string;
  email?: string;
  expiresAt?: string; // ISO timestamp
  /**
   * Free-form metadata for app-specific extensions (tier, flags, locale).
   * The starter never reads from here — your project does.
   */
  metadata?: Record<string, unknown>;
}

export const DEFAULT_TEST_SESSION: MockSession = {
  token: 'test-token-do-not-use-in-prod',
  userId: 'test-user-mobile-regression',
  email: 'test@example.invalid',
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  metadata: {},
};

/**
 * Standard listener/user session injection.
 *
 * Replace `app:session` with your project's actual localStorage key.
 */
export async function injectSession(
  page: Page,
  session: Partial<MockSession> = {},
  // TODO(mobile-test): replace placeholder key once auth contract confirmed.
  // No localStorage.setItem calls found in src/; storefront uses x-shop-id
  // header from build-time API_KEY. Wallet-connection state shape unknown.
  storageKey: string = 'next-shopfront:session',
): Promise<void> {
  const merged = {
    ...DEFAULT_TEST_SESSION,
    ...session,
    metadata: { ...DEFAULT_TEST_SESSION.metadata, ...session.metadata },
  };
  await page.addInitScript(({ key, value }) => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, { key: storageKey, value: merged });
}

/**
 * Admin-scoped session for admin route testing.
 *
 * Most apps have a separate "admin" gate. Inject the admin token under
 * the project's canonical key.
 */
export async function injectAdminSession(
  page: Page,
  adminToken: string = 'test-admin-token',
  storageKey: string = 'app:admin-session',
): Promise<void> {
  await page.addInitScript(({ key, value }) => {
    window.localStorage.setItem(key, JSON.stringify({
      token: value,
      adminAt: new Date().toISOString(),
    }));
  }, { key: storageKey, value: adminToken });
}

/**
 * Logged-out state — useful for testing public flows.
 *
 * Clears any session keys the app might have set. Customize SESSION_KEYS
 * to match your project's canonical session-key list.
 */
export async function clearSession(
  page: Page,
  sessionKeys: string[] = ['app:session', 'app:admin-session'],
): Promise<void> {
  await page.addInitScript((keys) => {
    keys.forEach((k) => window.localStorage.removeItem(k));
  }, sessionKeys);
}
