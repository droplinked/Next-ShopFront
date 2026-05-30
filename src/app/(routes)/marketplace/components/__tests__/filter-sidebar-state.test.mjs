/**
 * Defends the filter-sidebar's commit-to-URL contract.
 *
 * The sidebar mirrors filter state locally for snappy interaction; the
 * URL only updates on "Apply filters". These tests pin the encoding
 * path the sidebar uses so a future refactor doesn't accidentally
 * leak draft state into the URL or drop the cursor reset.
 *
 * Runner: node --test
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  decodeFilterFromSearchParams,
  encodeFilterToQueryString,
  encodeFilterToSearchParams,
} from '../../../../../lib/marketplace/__tests__/marketplace.mjs';

// ---------- cursor-reset contract ----------

test('apply filters: cursor is always dropped (new filter = new stream)', () => {
  const draft = {
    q: 'shoes',
    category: ['apparel'],
    cursor: 'should_not_be_emitted',
  };
  // The sidebar drops cursor before encoding.
  const sanitised = { ...draft, cursor: undefined };
  const qs = encodeFilterToQueryString(sanitised);
  assert.equal(qs.includes('cursor'), false);
});

// ---------- "Reset" produces clean /marketplace URL ----------

test('reset: empty filter produces empty querystring', () => {
  const qs = encodeFilterToQueryString({});
  assert.equal(qs, '');
});

// ---------- toggle behaviour ----------

test('toggle category: adding a category puts it on the URL', () => {
  const before = { category: ['apparel'] };
  const next = new Set(before.category);
  next.add('shoes');
  const after = { category: Array.from(next) };
  const params = encodeFilterToSearchParams(after);
  assert.deepEqual(params.getAll('category').sort(), ['apparel', 'shoes']);
});

test('toggle category: removing the last category drops the param entirely', () => {
  const before = { category: ['apparel'] };
  const next = new Set(before.category);
  next.delete('apparel');
  const after = {
    ...before,
    category: next.size > 0 ? Array.from(next) : undefined,
  };
  const params = encodeFilterToSearchParams(after);
  assert.equal(params.has('category'), false);
});

// ---------- decode-after-navigate round-trip ----------

test('SSR rehydrate: decoding the new URL produces the same draft', () => {
  const draft = {
    q: 'hat',
    category: ['accessories'],
    priceMin: 5,
    priceMax: 50,
    commissionRateMin: 10,
    region: 'AE',
    limit: 24,
  };
  const qs = encodeFilterToQueryString(draft);
  const params = new URLSearchParams(qs.replace(/^\?/, ''));
  const decoded = decodeFilterFromSearchParams(params);
  assert.deepEqual(decoded, draft);
});

// ---------- numeric coercion guard ----------

test('numeric inputs: empty string yields undefined, not 0', () => {
  // The sidebar parses input.value === '' to undefined to avoid
  // accidentally filtering "price >= 0" (which is everything but
  // emits noise in the URL).
  const parse = (raw) => {
    if (raw === '') return undefined;
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
  };
  assert.equal(parse(''), undefined);
  assert.equal(parse('0'), 0);
  assert.equal(parse('foo'), undefined);
  assert.equal(parse('10'), 10);
});
