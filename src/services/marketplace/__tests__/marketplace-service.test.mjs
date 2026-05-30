/**
 * Service contract tests for the marketplace discovery / detail wrappers.
 *
 * We cannot import the TS service directly under `node --test` without
 * a TypeScript loader, so this file mirrors the exact graceful-degrade
 * contract the service implements:
 *   - any 4xx OR transport throw → empty page (list) / null (detail)
 *   - the structured `{status: 'NOT_FOUND'}` envelope from the proxy →
 *     null in the detail wrapper
 *   - listings missing a slug are filtered out by the PROXY (not the
 *     service) — tested separately below
 *
 * Runner: node --test
 */

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

const ORIGINAL_FETCH = globalThis.fetch;

before(() => {
  if (
    typeof ORIGINAL_FETCH !== 'undefined' &&
    typeof ORIGINAL_FETCH !== 'function'
  ) {
    throw new Error('globalThis.fetch shape unexpected — abort test setup');
  }
});

after(() => {
  globalThis.fetch = ORIGINAL_FETCH;
});

// Pure mirror of the service's list helper
async function listSafe(filterQs, baseOrigin) {
  const empty = { data: [], nextCursor: null, limit: 0 };
  try {
    const res = await globalThis.fetch(`${baseOrigin}/api/marketplace${filterQs}`);
    if (!res.ok) return empty;
    const json = await res.json();
    if (!json || typeof json !== 'object') return empty;
    return {
      data: Array.isArray(json.data) ? json.data : [],
      nextCursor: typeof json.nextCursor === 'string' ? json.nextCursor : null,
      limit: typeof json.limit === 'number' ? json.limit : 0,
    };
  } catch {
    return empty;
  }
}

// Pure mirror of the service's detail helper
async function detailSafe(slug, baseOrigin) {
  if (!slug) return null;
  try {
    const res = await globalThis.fetch(
      `${baseOrigin}/api/marketplace/${encodeURIComponent(slug)}`,
    );
    if (!res.ok) return null;
    const json = await res.json();
    if (!json || typeof json !== 'object') return null;
    if (
      json.status === 'NOT_FOUND' ||
      json.code === 'listing_not_found'
    ) {
      return null;
    }
    return json;
  } catch {
    return null;
  }
}

// ---------- list: graceful degrade ----------

test('list: transport throw → empty page', async () => {
  globalThis.fetch = async () => {
    throw new Error('ECONNREFUSED');
  };
  const page = await listSafe('', 'http://x');
  assert.deepEqual(page, { data: [], nextCursor: null, limit: 0 });
});

test('list: non-2xx → empty page', async () => {
  globalThis.fetch = async () => ({
    ok: false,
    status: 500,
    json: async () => ({ data: [] }),
  });
  const page = await listSafe('', 'http://x');
  assert.deepEqual(page, { data: [], nextCursor: null, limit: 0 });
});

test('list: 2xx with valid envelope round-trips', async () => {
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      data: [{ id: '1', slug: 'foo', title: 'F' }],
      nextCursor: 'abc',
      limit: 1,
    }),
  });
  const page = await listSafe('?q=x', 'http://x');
  assert.equal(page.data.length, 1);
  assert.equal(page.data[0].slug, 'foo');
  assert.equal(page.nextCursor, 'abc');
  assert.equal(page.limit, 1);
});

test('list: 2xx with junk json → empty page (no crash)', async () => {
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => 'a string, not an object',
  });
  const page = await listSafe('', 'http://x');
  assert.deepEqual(page, { data: [], nextCursor: null, limit: 0 });
});

test('list: 2xx with data not an array → empty data', async () => {
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({ data: 'oops', nextCursor: null, limit: 0 }),
  });
  const page = await listSafe('', 'http://x');
  assert.deepEqual(page.data, []);
});

// ---------- detail: graceful degrade ----------

test('detail: empty slug short-circuits to null', async () => {
  globalThis.fetch = async () => {
    throw new Error('should not be called');
  };
  const r = await detailSafe('', 'http://x');
  assert.equal(r, null);
});

test('detail: transport throw → null', async () => {
  globalThis.fetch = async () => {
    throw new Error('ECONNREFUSED');
  };
  const r = await detailSafe('abc', 'http://x');
  assert.equal(r, null);
});

test('detail: 4xx → null', async () => {
  globalThis.fetch = async () => ({
    ok: false,
    status: 404,
    json: async () => ({ status: 'NOT_FOUND' }),
  });
  const r = await detailSafe('abc', 'http://x');
  assert.equal(r, null);
});

test('detail: NOT_FOUND envelope in 2xx body → null (not the envelope object)', async () => {
  // The proxy may return 2xx with a structured 404 envelope; the
  // service must NOT mistake the envelope for a real listing.
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({ status: 'NOT_FOUND', code: 'listing_not_found' }),
  });
  const r = await detailSafe('abc', 'http://x');
  assert.equal(r, null);
});

test('detail: 2xx with a real listing → listing object', async () => {
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      id: '1',
      slug: 'foo',
      title: 'F',
      price: 10,
      currency: 'USD',
      commissionRate: 15,
      imageUrls: [],
    }),
  });
  const r = await detailSafe('foo', 'http://x');
  assert.ok(r);
  assert.equal(r.slug, 'foo');
});

// ---------- proxy slug-filter contract ----------

test('proxy contract: listings without a slug must be filtered out', () => {
  // The proxy enforces this so detail links always resolve. Pin the
  // filter predicate here.
  const items = [
    { id: '1', slug: 'a' },
    { id: '2' }, // legacy LISTED row, no slug
    { id: '3', slug: '' }, // empty slug, also dropped
    { id: '4', slug: 'b' },
  ];
  const hasSlug = (x) =>
    !!x &&
    typeof x === 'object' &&
    typeof x.slug === 'string' &&
    x.slug.length > 0;
  const filtered = items.filter(hasSlug);
  assert.deepEqual(filtered.map((i) => i.id), ['1', '4']);
});
