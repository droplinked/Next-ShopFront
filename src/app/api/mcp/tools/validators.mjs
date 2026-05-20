/**
 * Pure input validators for MCP tools — kept as ESM (.mjs) so the Node
 * built-in test runner (`node --test`) can import them directly without a
 * TypeScript toolchain.
 *
 * The TypeScript dispatcher (./dispatcher.ts) re-exports these so there is
 * exactly one source of truth for validation logic.
 */

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0
}

function optString(v) {
  return typeof v === 'string' && v.length > 0 ? v : undefined
}

function clampInt(v, min, max, fallback) {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? parseInt(v, 10) : NaN
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(max, Math.floor(n)))
}

export function validateListProducts(i) {
  return {
    ok: true,
    value: {
      store: optString(i.store),
      category: optString(i.category),
      q: optString(i.q),
      page: clampInt(i.page, 1, 1000, 1),
      limit: clampInt(i.limit, 1, 100, 20),
    },
  }
}

export function validateGetProduct(i) {
  if (!isNonEmptyString(i.id_or_slug)) {
    return { ok: false, error: 'id_or_slug (string) is required', status: 400 }
  }
  if (/[\/\?#]/.test(i.id_or_slug)) {
    return { ok: false, error: 'id_or_slug must not contain /, ?, or #', status: 400 }
  }
  return { ok: true, value: { id_or_slug: i.id_or_slug } }
}

export function validateGetAffiliateLink(i) {
  if (!isNonEmptyString(i.product_id)) {
    return { ok: false, error: 'product_id (string) is required', status: 400 }
  }
  if (!isNonEmptyString(i.affiliate_code)) {
    return { ok: false, error: 'affiliate_code (string) is required', status: 400 }
  }
  if (!/^[A-Za-z0-9_-]{3,64}$/.test(i.affiliate_code)) {
    return {
      ok: false,
      error: 'affiliate_code must be 3-64 chars of [A-Za-z0-9_-]',
      status: 400,
    }
  }
  return { ok: true, value: { product_id: i.product_id, affiliate_code: i.affiliate_code } }
}

export function validateSearchStores(i) {
  if (!isNonEmptyString(i.q)) {
    return { ok: false, error: 'q (string) is required', status: 400 }
  }
  if (i.q.length > 128) {
    return { ok: false, error: 'q must be 128 chars or fewer', status: 400 }
  }
  return { ok: true, value: { q: i.q, limit: clampInt(i.limit, 1, 50, 10) } }
}

export function validateGetCategories(_i) {
  return { ok: true, value: {} }
}

export const KNOWN_TOOL_NAMES = [
  'list_products',
  'get_product',
  'get_affiliate_link',
  'search_stores',
  'get_categories',
]
