import type { Page, Locator } from '@playwright/test';

/**
 * Typed data-testid helper.
 *
 * Mandate data-testid for all assertions. Classes and copy change with
 * refactors; testids are stable contracts. This helper just gives you a
 * one-line selector and removes the temptation to fall back to CSS.
 *
 * Usage:
 *   await byTestId(page, 'play-button').click();
 */

export function byTestId(page: Page, id: string): Locator {
  return page.locator(`[data-testid="${id}"]`);
}

/**
 * Variant that supports nested testid scoping.
 *
 *   const modal = byTestId(page, 'wallet-modal');
 *   await byTestIdWithin(modal, 'close-button').click();
 */
export function byTestIdWithin(scope: Locator, id: string): Locator {
  return scope.locator(`[data-testid="${id}"]`);
}
