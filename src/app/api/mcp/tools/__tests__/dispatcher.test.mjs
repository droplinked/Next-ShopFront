/**
 * Unit tests for the MCP tool dispatcher's input-validation layer.
 *
 * Runner: Node's built-in test runner (`node --test`). Repo has no
 * jest/vitest, matching the pattern in src/__smoke__/.
 *
 * Invoke directly:
 *   node --test src/app/api/mcp/tools/__tests__/dispatcher.test.mjs
 * Or via npm:
 *   npm test
 *
 * We test the validators exported from ./validators.mjs (the single source
 * of truth that the TS dispatcher re-exports). That keeps the tests
 * runtime-pure — no Next.js, no TypeScript compile step, no fetchInstance
 * dependency.
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  validateListProducts,
  validateGetProduct,
  validateGetAffiliateLink,
  validateSearchStores,
  validateGetCategories,
  KNOWN_TOOL_NAMES,
} from '../validators.mjs'

// ---------- registry sanity ----------

test('KNOWN_TOOL_NAMES includes the 5 expected tools (3 original + 2 new)', () => {
  assert.deepEqual(
    [...KNOWN_TOOL_NAMES].sort(),
    [
      'get_affiliate_link',
      'get_categories',
      'get_product',
      'list_products',
      'search_stores',
    ],
  )
})

// ---------- list_products ----------

test('list_products: empty input applies safe defaults', () => {
  const r = validateListProducts({})
  assert.equal(r.ok, true)
  assert.equal(r.value.page, 1)
  assert.equal(r.value.limit, 20)
  assert.equal(r.value.store, undefined)
})

test('list_products: clamps limit to max 100', () => {
  const r = validateListProducts({ limit: 9999 })
  assert.equal(r.ok, true)
  assert.equal(r.value.limit, 100)
})

test('list_products: clamps page to min 1 on negative input', () => {
  const r = validateListProducts({ page: -5 })
  assert.equal(r.ok, true)
  assert.equal(r.value.page, 1)
})

test('list_products: ignores non-string store/category/q', () => {
  const r = validateListProducts({ store: 42, category: null, q: { evil: true } })
  assert.equal(r.ok, true)
  assert.equal(r.value.store, undefined)
  assert.equal(r.value.category, undefined)
  assert.equal(r.value.q, undefined)
})

// ---------- get_product ----------

test('get_product: rejects missing id_or_slug with 400', () => {
  const r = validateGetProduct({})
  assert.equal(r.ok, false)
  assert.equal(r.status, 400)
  assert.match(r.error, /id_or_slug/)
})

test('get_product: rejects empty-string id_or_slug', () => {
  const r = validateGetProduct({ id_or_slug: '   ' })
  assert.equal(r.ok, false)
  assert.equal(r.status, 400)
})

test('get_product: rejects path-traversal characters', () => {
  for (const bad of ['../etc', 'a/b', 'a?b', 'a#b']) {
    const r = validateGetProduct({ id_or_slug: bad })
    assert.equal(r.ok, false, `expected reject for ${bad}`)
    assert.equal(r.status, 400)
  }
})

test('get_product: accepts ObjectId hex and URL slug', () => {
  for (const good of ['6710abc123def456789012ab', 'hoodie-deluxe']) {
    const r = validateGetProduct({ id_or_slug: good })
    assert.equal(r.ok, true, `expected accept for ${good}`)
    assert.equal(r.value.id_or_slug, good)
  }
})

// ---------- get_affiliate_link ----------

test('get_affiliate_link: requires both product_id and affiliate_code', () => {
  assert.equal(validateGetAffiliateLink({}).ok, false)
  assert.equal(validateGetAffiliateLink({ product_id: 'p' }).ok, false)
  assert.equal(validateGetAffiliateLink({ affiliate_code: 'ali_2026' }).ok, false)
})

test('get_affiliate_link: rejects malformed affiliate_code shapes', () => {
  for (const bad of ['ab', '!!!', 'a'.repeat(65), 'has space']) {
    const r = validateGetAffiliateLink({ product_id: 'p1', affiliate_code: bad })
    assert.equal(r.ok, false, `expected reject for ${bad}`)
    assert.equal(r.status, 400)
  }
})

test('get_affiliate_link: accepts canonical [A-Za-z0-9_-]{3,64} codes', () => {
  for (const good of ['ali_2026', 'A-1', 'a'.repeat(64)]) {
    const r = validateGetAffiliateLink({ product_id: 'p1', affiliate_code: good })
    assert.equal(r.ok, true, `expected accept for ${good}`)
  }
})

// ---------- search_stores (NEW) ----------

test('search_stores: requires q', () => {
  const r = validateSearchStores({})
  assert.equal(r.ok, false)
  assert.equal(r.status, 400)
  assert.match(r.error, /q /)
})

test('search_stores: rejects q over 128 chars', () => {
  const r = validateSearchStores({ q: 'x'.repeat(129) })
  assert.equal(r.ok, false)
  assert.equal(r.status, 400)
})

test('search_stores: applies default limit 10 and clamps to 50', () => {
  const a = validateSearchStores({ q: 'roomours' })
  assert.equal(a.ok, true)
  assert.equal(a.value.limit, 10)
  const b = validateSearchStores({ q: 'roomours', limit: 9999 })
  assert.equal(b.ok, true)
  assert.equal(b.value.limit, 50)
})

// ---------- get_categories (NEW) ----------

test('get_categories: accepts empty input without error', () => {
  const r = validateGetCategories({})
  assert.equal(r.ok, true)
  assert.deepEqual(r.value, {})
})

test('get_categories: accepts (and ignores) arbitrary input', () => {
  const r = validateGetCategories({ unexpected: 'field' })
  assert.equal(r.ok, true)
})
