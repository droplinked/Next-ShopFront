import { test, expect } from '@playwright/test';
import { mockExternalServices } from '../helpers/network';

/**
 * CSP compliance — verify Content-Security-Policy doesn't break pages.
 *
 * Both directions:
 *   1. Report-Only CSP: catch violations early but don't break the page
 *   2. Enforcing CSP: assert no `Refused to ...` console errors
 *
 * CUSTOMIZE: PATHS, CSP_ALLOW (known-safe violation patterns to ignore).
 */

const PATHS = ['/', '/story/sample', '/pricing', '/listen'];

// Substrings that, if present in a CSP violation, are known-safe and ignored.
// Tighten this list aggressively for your app.
const CSP_ALLOW: string[] = [
  // Example: 'chrome-extension://',  // user browser extensions
];

test.describe('CSP compliance', () => {
  test.beforeEach(async ({ page }) => {
    await mockExternalServices(page);
  });

  for (const path of PATHS) {
    test(`${path}: zero CSP violations`, async ({ page }) => {
      const violations: string[] = [];
      page.on('console', (msg) => {
        const text = msg.text();
        if (msg.type() !== 'error') return;
        if (!text.includes('Content Security Policy') && !text.startsWith('Refused to')) return;
        if (CSP_ALLOW.some((ok) => text.includes(ok))) return;
        violations.push(text);
      });

      const response = await page.goto(path);
      await page.waitForLoadState('networkidle').catch(() => {/* SSE-OK */});

      // Verify a CSP header is present (Report-Only or enforcing)
      const cspHeader =
        response?.headers()['content-security-policy'] ??
        response?.headers()['content-security-policy-report-only'];
      expect(cspHeader, `${path} has no CSP header at all`).toBeDefined();

      expect(violations, `${path} produced CSP violations:\n${violations.join('\n')}`).toEqual([]);
    });
  }
});
