/**
 * MCP tool dispatcher — pure, transport-agnostic logic split out from the
 * Next.js route handler so it can be unit-tested with `node --test`.
 *
 * Each tool has:
 *   - a `validate(input)` step that returns either `{ ok: true, value }` or
 *     `{ ok: false, error, status }` — no exceptions for malformed input
 *     (cheaper for agents to retry against a 4xx body than a 500).
 *   - an `execute(value)` step that returns the upstream payload. Network /
 *     upstream errors bubble up as exceptions; the route handler converts
 *     them to `{ error }` with a 200 status (per spec: "200 + {error} body
 *     for transient; 4xx for malformed").
 *
 * Rate limiting: the real limiter belongs in sidekick's framework. We add a
 * stub `X-RateLimit-Remaining` header in the route so MCP clients can start
 * relying on the header now without behavioural change later.
 */

import { fetchInstance } from '@/lib/fetchInstance'
// Validators live in a .mjs sibling so `node --test` can unit-test them
// without a TS toolchain. Single source of truth.
import {
  validateListProducts as _validateListProducts,
  validateGetProduct as _validateGetProduct,
  validateGetAffiliateLink as _validateGetAffiliateLink,
  validateSearchStores as _validateSearchStores,
  validateGetCategories as _validateGetCategories,
} from './validators.mjs'

export type ToolInput = Record<string, unknown>

export type ValidationOk<T> = { ok: true; value: T }
export type ValidationErr = { ok: false; error: string; status: number }
export type ValidationResult<T> = ValidationOk<T> | ValidationErr

// ---------- tool: list_products ----------

export type ListProductsInput = {
  store?: string
  category?: string
  q?: string
  page: number
  limit: number
}

export const validateListProducts = _validateListProducts as (
  i: ToolInput,
) => ValidationResult<ListProductsInput>

async function executeListProducts(v: ListProductsInput): Promise<unknown> {
  const sp = new URLSearchParams({ affiliate: 'true' })
  if (v.store) sp.set('store', v.store)
  if (v.category) sp.set('category', v.category)
  if (v.q) sp.set('q', v.q)
  sp.set('page', String(v.page))
  sp.set('limit', String(v.limit))
  return fetchInstance(`products/public?${sp.toString()}`)
}

// ---------- tool: get_product ----------

export type GetProductInput = { id_or_slug: string }

export const validateGetProduct = _validateGetProduct as (
  i: ToolInput,
) => ValidationResult<GetProductInput>

async function executeGetProduct(v: GetProductInput): Promise<unknown> {
  return fetchInstance(`products/${encodeURIComponent(v.id_or_slug)}`)
}

// ---------- tool: get_affiliate_link ----------

export type GetAffiliateLinkInput = { product_id: string; affiliate_code: string }

export const validateGetAffiliateLink = _validateGetAffiliateLink as (
  i: ToolInput,
) => ValidationResult<GetAffiliateLinkInput>

async function executeGetAffiliateLink(v: GetAffiliateLinkInput): Promise<unknown> {
  // Pure URL synthesis — no upstream call. Public-facing storefront URL.
  return {
    url: `https://droplinked.com/p/${encodeURIComponent(v.product_id)}?aff=${encodeURIComponent(v.affiliate_code)}`,
  }
}

// ---------- tool: search_stores (NEW) ----------

export type SearchStoresInput = { q: string; limit: number }

export const validateSearchStores = _validateSearchStores as (
  i: ToolInput,
) => ValidationResult<SearchStoresInput>

async function executeSearchStores(v: SearchStoresInput): Promise<unknown> {
  // TODO(apiv3): no canonical /stores/search endpoint exists yet. Filed as
  // operator-decision item. For now we try `/shops/public?q=...` (current
  // behaviour of the storefront discovery surface) and surface a tagged
  // response so MCP clients can detect the stub.
  try {
    const sp = new URLSearchParams({ q: v.q, limit: String(v.limit), public: 'true' })
    const data = await fetchInstance(`shops/public?${sp.toString()}`)
    return { stub: false, data }
  } catch (e) {
    return {
      stub: true,
      reason: 'apiv3 store-search endpoint not implemented; placeholder response',
      data: [],
      detail: e instanceof Error ? e.message : 'fetch failed',
    }
  }
}

// ---------- tool: get_categories (NEW) ----------

export type GetCategoriesInput = Record<string, never>

export const validateGetCategories = _validateGetCategories as (
  i: ToolInput,
) => ValidationResult<GetCategoriesInput>

// Mirror of KNOWN_CATEGORIES in the affiliate-products page. Kept duplicated
// rather than imported because that file is a Server Component (RSC) and we
// don't want to drag its module graph into the API route.
const STATIC_CATEGORIES = [
  'apparel',
  'accessories',
  'home',
  'beauty',
  'electronics',
  'collectibles',
  'digital',
  'other',
] as const

async function executeGetCategories(_v: GetCategoriesInput): Promise<unknown> {
  // Future: fetch from apiv3 once a `/products/categories` endpoint exists.
  // For now return the static enum so agents can populate filter UIs.
  return { categories: STATIC_CATEGORIES, source: 'static-enum' }
}

// ---------- registry ----------

export type ToolName =
  | 'list_products'
  | 'get_product'
  | 'get_affiliate_link'
  | 'search_stores'
  | 'get_categories'

type ToolDef<T> = {
  validate: (i: ToolInput) => ValidationResult<T>
  execute: (v: T) => Promise<unknown>
}

export const TOOLS: { [K in ToolName]: ToolDef<unknown> } = {
  list_products: { validate: validateListProducts as ToolDef<unknown>['validate'], execute: executeListProducts as ToolDef<unknown>['execute'] },
  get_product: { validate: validateGetProduct as ToolDef<unknown>['validate'], execute: executeGetProduct as ToolDef<unknown>['execute'] },
  get_affiliate_link: { validate: validateGetAffiliateLink as ToolDef<unknown>['validate'], execute: executeGetAffiliateLink as ToolDef<unknown>['execute'] },
  search_stores: { validate: validateSearchStores as ToolDef<unknown>['validate'], execute: executeSearchStores as ToolDef<unknown>['execute'] },
  get_categories: { validate: validateGetCategories as ToolDef<unknown>['validate'], execute: executeGetCategories as ToolDef<unknown>['execute'] },
}

export function isKnownTool(name: string): name is ToolName {
  return Object.prototype.hasOwnProperty.call(TOOLS, name)
}

export type DispatchOutcome =
  | { kind: 'unknown_tool'; status: 404; body: { error: string } }
  | { kind: 'invalid_input'; status: number; body: { tool: string; error: string } }
  | { kind: 'transient_error'; status: 200; body: { tool: string; error: string } }
  | { kind: 'ok'; status: 200; body: { tool: string; data: unknown } }

/**
 * Pure dispatch — does the validation step, runs the tool, classifies the
 * outcome. Route handler just maps this to a NextResponse + headers. Used
 * directly from unit tests.
 */
export async function dispatch(tool: string, input: ToolInput): Promise<DispatchOutcome> {
  if (!isKnownTool(tool)) {
    return { kind: 'unknown_tool', status: 404, body: { error: `Unknown tool: ${tool}` } }
  }
  const def = TOOLS[tool]
  const v = def.validate(input)
  if (!v.ok) {
    return { kind: 'invalid_input', status: v.status, body: { tool, error: v.error } }
  }
  try {
    const data = await def.execute(v.value)
    return { kind: 'ok', status: 200, body: { tool, data } }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'tool execution failed'
    // Transient/upstream errors → 200 + {error} per MCP-friendly contract.
    return { kind: 'transient_error', status: 200, body: { tool, error: message } }
  }
}
