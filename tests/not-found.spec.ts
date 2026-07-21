import { expect, test } from '@playwright/test';

test.describe('Not-found recovery', () => {
  test('invalid storefront links show recovery actions below the fixed header', async ({ page }) => {
    await page.goto('/qa-missing-storefront');

    const heading = page.getByRole('heading', { name: 'Page not found' });
    await expect(heading).toBeVisible();
    await expect(page.getByRole('link', { name: 'Browse products' })).toHaveAttribute('href', '/');
    await expect(page.getByRole('link', { name: 'Contact support' })).toHaveAttribute('href', '/contact');

    const header = page.locator('header').first();
    const headingBox = await heading.boundingBox();
    const headerBox = await header.boundingBox();

    expect(headingBox).not.toBeNull();
    expect(headerBox).not.toBeNull();
    expect(headingBox!.y).toBeGreaterThanOrEqual(headerBox!.y + headerBox!.height);
  });
});
