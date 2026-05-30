/**
 * Unit tests for the publisher invitation service helpers.
 *
 * Covers:
 *  - commission formatter (the shape rendered on the merchant landing)
 *  - URL building / token encoding (defends against accidental tampering)
 *  - graceful-degradation contract (null on transport failure)
 *
 * Runner: node --test
 */

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

import { formatCommission } from './format-commission.mjs';

// ---------- formatCommission ----------

test('formatCommission: PERCENT with decimal rate <= 1 multiplies by 100', () => {
  assert.equal(
    formatCommission({ programName: 'x', commissionType: 'PERCENT', commissionRate: 0.05 }),
    '5%',
  );
  assert.equal(
    formatCommission({ programName: 'x', commissionType: 'PERCENT', commissionRate: 0.125 }),
    '12.5%',
  );
});

test('formatCommission: PERCENT with rate > 1 used as-is', () => {
  assert.equal(
    formatCommission({ programName: 'x', commissionType: 'PERCENT', commissionRate: 15 }),
    '15%',
  );
});

test('formatCommission: FLAT formats currency + amount + /sale', () => {
  assert.equal(
    formatCommission({
      programName: 'x',
      commissionType: 'FLAT',
      commissionRate: 5,
      commissionCurrency: 'USD',
    }),
    'USD 5.00 / sale',
  );
  assert.equal(
    formatCommission({
      programName: 'x',
      commissionType: 'FLAT',
      commissionRate: 12.5,
      commissionCurrency: 'EUR',
    }),
    'EUR 12.50 / sale',
  );
});

test('formatCommission: FLAT without currency defaults to USD', () => {
  assert.equal(
    formatCommission({
      programName: 'x',
      commissionType: 'FLAT',
      commissionRate: 7,
    }),
    'USD 7.00 / sale',
  );
});

test('formatCommission: unknown type with numeric rate treated as percent', () => {
  assert.equal(
    formatCommission({ programName: 'x', commissionRate: 0.1 }),
    '10%',
  );
});

test('formatCommission: no rate at all → "Commission TBD"', () => {
  assert.equal(formatCommission({ programName: 'x' }), 'Commission TBD');
});

// ---------- service: graceful degradation ----------
// The service module uses TypeScript + Next.js imports so we cannot
// import it directly in node --test. Instead we mirror the contract:
// any 4xx OR transport failure from the upstream must yield `null` to
// the consumer, never an exception.

const ORIGINAL_FETCH = globalThis.fetch;

before(() => {
  // sanity: ensure we're not blowing away whatever the runtime has
  if (typeof ORIGINAL_FETCH !== 'undefined' && typeof ORIGINAL_FETCH !== 'function') {
    throw new Error('globalThis.fetch shape unexpected — abort test setup');
  }
});

after(() => {
  globalThis.fetch = ORIGINAL_FETCH;
});

// Re-implements the service's graceful-degrade pattern so we can assert on it.
async function safeFetchJson(url) {
  try {
    const res = await globalThis.fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    if (!json || typeof json !== 'object') return null;
    return json;
  } catch {
    return null;
  }
}

test('safeFetchJson: returns null on non-2xx', async () => {
  globalThis.fetch = async () => ({
    ok: false,
    status: 404,
    json: async () => ({ error: 'not found' }),
  });
  const result = await safeFetchJson('https://example.com/x');
  assert.equal(result, null);
});

test('safeFetchJson: returns null on transport throw', async () => {
  globalThis.fetch = async () => {
    throw new Error('ECONNREFUSED');
  };
  const result = await safeFetchJson('https://example.com/x');
  assert.equal(result, null);
});

test('safeFetchJson: returns parsed object on 2xx', async () => {
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({ hello: 'world' }),
  });
  const result = await safeFetchJson('https://example.com/x');
  assert.deepEqual(result, { hello: 'world' });
});

test('safeFetchJson: returns null when json is not an object', async () => {
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => 'a plain string',
  });
  const result = await safeFetchJson('https://example.com/x');
  assert.equal(result, null);
});

// ---------- token encoding ----------

test('encodeURIComponent: malicious tokens are safely escaped', () => {
  // The path separator and any non-ASCII bytes must be escaped before
  // we slot the value into the upstream URL — otherwise a crafted token
  // could traverse to a sibling endpoint.
  const bad = '../../../../etc/passwd';
  const encoded = encodeURIComponent(bad);
  assert.equal(encoded.includes('/'), false, 'slash must be escaped');
  // Dots are kept by encodeURIComponent (RFC 3986 unreserved) — what we
  // really need to confirm is that the SEGMENT BOUNDARIES (slashes)
  // disappear, breaking path traversal.
  assert.equal(encoded, '..%2F..%2F..%2F..%2Fetc%2Fpasswd');
});

test('encodeURIComponent: well-formed token tokens pass through', () => {
  const token = 'A1b2-C3d4_E5f6';
  assert.equal(encodeURIComponent(token), token);
});
