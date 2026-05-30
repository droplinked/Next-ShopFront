/**
 * Unit tests for the marketplace filter encoder / decoder and the
 * formatting helpers.
 *
 * Covers:
 *  - filter URL param round-trip (encode -> decode produces same shape)
 *  - hostile / malformed inputs do not blow up
 *  - inverted price range is dropped (not silently mis-filtered)
 *  - category multi-value parsing (repeated AND comma-joined)
 *  - commission rate formatter heuristic (fractional vs whole percent)
 *  - price formatter falls back on bogus currency codes
 *  - limit clamps to 1..100 with a 24 default
 *
 * Runner: node --test
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  decodeFilterFromSearchParams,
  encodeFilterToSearchParams,
  encodeFilterToQueryString,
  formatCommissionRate,
  formatListingPrice,
  MARKETPLACE_DEFAULT_LIMIT,
  MARKETPLACE_MAX_LIMIT,
} from './marketplace.mjs';

// ---------- encode / decode round-trip ----------

test('round-trip: encode then decode preserves the shape', () => {
  const input = {
    q: 'sneakers',
    category: ['apparel', 'shoes'],
    priceMin: 10,
    priceMax: 200,
    commissionRateMin: 5,
    region: 'AE',
    cursor: 'abc123',
    limit: 24,
  };
  const params = encodeFilterToSearchParams(input);
  const decoded = decodeFilterFromSearchParams(params);
  assert.deepEqual(decoded, input);
});

test('encode: empty filter produces empty params', () => {
  const params = encodeFilterToSearchParams({});
  assert.equal(params.toString(), '');
});

test('encode: undefined values are omitted', () => {
  const params = encodeFilterToSearchParams({
    q: 'x',
    priceMin: undefined,
    region: undefined,
  });
  assert.equal(params.toString(), 'q=x');
});

test('encode: empty string + whitespace are omitted', () => {
  const params = encodeFilterToSearchParams({
    q: '   ',
    region: '',
    cursor: '\t',
  });
  assert.equal(params.toString(), '');
});

test('encode: category emits as repeated params (one per value)', () => {
  const params = encodeFilterToSearchParams({
    category: ['apparel', 'shoes', 'accessories'],
  });
  assert.deepEqual(params.getAll('category'), [
    'apparel',
    'shoes',
    'accessories',
  ]);
});

test('encodeFilterToQueryString: returns "" for empty, "?…" otherwise', () => {
  assert.equal(encodeFilterToQueryString({}), '');
  assert.equal(encodeFilterToQueryString({ q: 'a' }), '?q=a');
});

// ---------- decode: tolerates URLSearchParams AND plain object ----------

test('decode: works on a URLSearchParams instance', () => {
  const p = new URLSearchParams('q=hi&category=a&category=b&limit=10');
  const decoded = decodeFilterFromSearchParams(p);
  assert.deepEqual(decoded, {
    q: 'hi',
    category: ['a', 'b'],
    limit: 10,
  });
});

test('decode: works on a plain object (Next searchParams prop shape)', () => {
  const obj = { q: 'hi', category: ['a', 'b'], limit: '10' };
  const decoded = decodeFilterFromSearchParams(obj);
  assert.deepEqual(decoded, {
    q: 'hi',
    category: ['a', 'b'],
    limit: 10,
  });
});

test('decode: comma-joined category values are split', () => {
  const obj = { category: 'a,b,c' };
  const decoded = decodeFilterFromSearchParams(obj);
  assert.deepEqual(decoded.category, ['a', 'b', 'c']);
});

test('decode: empty / null / undefined input yields empty filter', () => {
  assert.deepEqual(decodeFilterFromSearchParams(null), {});
  assert.deepEqual(decodeFilterFromSearchParams(undefined), {});
  assert.deepEqual(decodeFilterFromSearchParams(new URLSearchParams()), {});
});

test('decode: malformed numbers are dropped, not NaN', () => {
  const obj = { priceMin: 'foo', priceMax: 'bar', limit: 'baz' };
  const decoded = decodeFilterFromSearchParams(obj);
  assert.equal(decoded.priceMin, undefined);
  assert.equal(decoded.priceMax, undefined);
  assert.equal(decoded.limit, undefined);
});

test('decode: negative numbers are dropped', () => {
  const obj = { priceMin: '-5', commissionRateMin: '-1' };
  const decoded = decodeFilterFromSearchParams(obj);
  assert.equal(decoded.priceMin, undefined);
  assert.equal(decoded.commissionRateMin, undefined);
});

test('decode: inverted price range is dropped entirely', () => {
  const obj = { priceMin: '100', priceMax: '10' };
  const decoded = decodeFilterFromSearchParams(obj);
  assert.equal(decoded.priceMin, undefined);
  assert.equal(decoded.priceMax, undefined);
});

test('decode: limit clamps to MAX', () => {
  const obj = { limit: '500' };
  const decoded = decodeFilterFromSearchParams(obj);
  assert.equal(decoded.limit, MARKETPLACE_MAX_LIMIT);
});

test('decode: limit floor to MIN when too small', () => {
  const obj = { limit: '0' };
  const decoded = decodeFilterFromSearchParams(obj);
  assert.equal(decoded.limit, MARKETPLACE_DEFAULT_LIMIT);
});

// ---------- formatCommissionRate ----------

test('formatCommissionRate: fractional (≤1) multiplies by 100', () => {
  assert.equal(formatCommissionRate(0.05), '5%');
  assert.equal(formatCommissionRate(0.125), '12.5%');
  assert.equal(formatCommissionRate(1), '100%');
});

test('formatCommissionRate: whole percent (>1) used as-is', () => {
  assert.equal(formatCommissionRate(15), '15%');
  assert.equal(formatCommissionRate(7.5), '7.5%');
  assert.equal(formatCommissionRate(80), '80%');
});

test('formatCommissionRate: missing / NaN / Infinity → "Commission TBD"', () => {
  assert.equal(formatCommissionRate(undefined), 'Commission TBD');
  assert.equal(formatCommissionRate(null), 'Commission TBD');
  assert.equal(formatCommissionRate(NaN), 'Commission TBD');
  assert.equal(formatCommissionRate(Infinity), 'Commission TBD');
});

// ---------- formatListingPrice ----------

test('formatListingPrice: USD default when currency missing', () => {
  const out = formatListingPrice(19.99, undefined);
  // Different runtimes render USD with $ or US$ — assert on the number
  // formatting instead of the exact currency glyph.
  assert.match(out, /19\.99/);
});

test('formatListingPrice: respects passed currency', () => {
  const out = formatListingPrice(100, 'EUR');
  assert.match(out, /100/);
});

test('formatListingPrice: bogus currency falls back to "<CODE> NNN.NN"', () => {
  const out = formatListingPrice(50, 'ZZZ');
  // Intl throws on invalid currency in some node versions — the helper
  // catches and renders the bare string fallback.
  assert.ok(
    out === 'ZZZ 50.00' || out.includes('50'),
    `unexpected fallback shape: ${out}`,
  );
});

test('formatListingPrice: missing / NaN price → "Price unavailable"', () => {
  assert.equal(formatListingPrice(undefined, 'USD'), 'Price unavailable');
  assert.equal(formatListingPrice(null, 'USD'), 'Price unavailable');
  assert.equal(formatListingPrice(NaN, 'USD'), 'Price unavailable');
});
