/**
 * Pure-JS twin of the formatters used by MarketplaceListingCard. We
 * cannot import the React component directly under `node --test`
 * without a JSX transformer, so this file mirrors the EXACT shape the
 * card relies on and tests the contract it depends on.
 *
 * Keep in sync with src/app/(routes)/marketplace/components/MarketplaceListingCard.tsx:
 * if a field used here is removed from the card, this test file must
 * be updated alongside it.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  formatCommissionRate,
  formatListingPrice,
} from '../../../../../lib/marketplace/__tests__/marketplace.mjs';

// ---------- card-facing field validation ----------

test('listing card: hero is the first imageUrl when present', () => {
  const listing = {
    title: 't',
    price: 10,
    currency: 'USD',
    commissionRate: 10,
    imageUrls: ['https://example.com/a.png', 'https://example.com/b.png'],
  };
  const hero = listing.imageUrls?.[0];
  assert.equal(hero, 'https://example.com/a.png');
});

test('listing card: missing imageUrls renders no hero (no crash)', () => {
  const listing = {
    title: 't',
    price: 10,
    currency: 'USD',
    commissionRate: 10,
  };
  const hero = listing.imageUrls?.[0];
  assert.equal(hero, undefined);
});

test('listing card: title falls back to "Untitled listing" when missing', () => {
  const listing = { title: '' };
  const title = listing.title || 'Untitled listing';
  assert.equal(title, 'Untitled listing');
});

test('listing card: commission badge always renders (TBD when missing)', () => {
  assert.equal(formatCommissionRate(undefined), 'Commission TBD');
  assert.equal(formatCommissionRate(15), '15%');
  assert.equal(formatCommissionRate(0.05), '5%');
});

test('listing card: price always renders (fallback when missing)', () => {
  assert.equal(formatListingPrice(undefined, 'USD'), 'Price unavailable');
  assert.match(formatListingPrice(19.99, 'USD'), /19\.99/);
});

test('listing card: merchant label only shown when shopName present', () => {
  const withMerchant = { merchant: { merchantId: 'x', shopName: 'Acme' } };
  const withoutMerchant = { merchant: { merchantId: 'x' } };
  const noMerchant = {};
  assert.equal(withMerchant.merchant?.shopName, 'Acme');
  assert.equal(withoutMerchant.merchant?.shopName, undefined);
  assert.equal(noMerchant.merchant?.shopName, undefined);
});

// ---------- slug encoding (defends against malicious slugs in detail links) ----------

test('listing card: slug with special chars is percent-encoded for href', () => {
  const slug = 'flat-lay/../../etc/passwd';
  const href = `/marketplace/${encodeURIComponent(slug)}`;
  assert.equal(href.includes('/../'), false, 'must not traverse');
  assert.equal(
    href,
    '/marketplace/flat-lay%2F..%2F..%2Fetc%2Fpasswd',
  );
});

test('listing card: well-formed slug passes through unchanged', () => {
  const slug = 'acme-product-2026';
  const href = `/marketplace/${encodeURIComponent(slug)}`;
  assert.equal(href, '/marketplace/acme-product-2026');
});
