/**
 * Filter URL-param encoding / decoding for the public marketplace
 * discovery surface.
 *
 * The discovery filter state lives in `?` URL params so:
 *   - filter changes are deep-linkable
 *   - SSR knows the requested filter on first render (no client flicker)
 *   - back / forward navigation restores prior filter state
 *
 * Param shape mirrors the backend `ListFilterDto`:
 *   q, category (repeated), priceMin, priceMax, commissionRateMin,
 *   region, cursor, limit.
 *
 * Categories are emitted as repeated `category=` params (one per value)
 * to match Nest's `@IsArray() category?: string[]` parsing.
 *
 * The helpers are pure (no React, no fetch) so they can be unit-tested
 * with `node --test`.
 */

import type {
  IMarketplaceListingFilter,
} from '@/types/interfaces/marketplace/listing';
import {
  MARKETPLACE_DEFAULT_LIMIT,
  MARKETPLACE_MAX_LIMIT,
} from '@/types/interfaces/marketplace/listing';

/**
 * Coerces a raw string into a positive finite number, or undefined.
 * Used so a malformed `?priceMin=foo` doesn't blow up the page.
 */
function toFiniteNumber(value: string | null | undefined): number | undefined {
  if (value === null || value === undefined) return undefined;
  if (value === '') return undefined;
  const n = Number(value);
  if (!Number.isFinite(n)) return undefined;
  if (n < 0) return undefined;
  return n;
}

/**
 * Clamps `limit` to the backend-accepted range and falls back to the
 * default when missing/malformed.
 */
function normaliseLimit(value: number | undefined): number {
  if (value === undefined) return MARKETPLACE_DEFAULT_LIMIT;
  if (!Number.isFinite(value) || value < 1) return MARKETPLACE_DEFAULT_LIMIT;
  if (value > MARKETPLACE_MAX_LIMIT) return MARKETPLACE_MAX_LIMIT;
  return Math.floor(value);
}

/**
 * Decodes a URLSearchParams-like into an IMarketplaceListingFilter.
 *
 * Accepts both URLSearchParams (browser/Next /search params) and plain
 * objects of the same shape (Next.js `searchParams` prop). Unknown keys
 * are silently dropped.
 */
export function decodeFilterFromSearchParams(
  input:
    | URLSearchParams
    | Record<string, string | string[] | undefined>
    | undefined
    | null,
): IMarketplaceListingFilter {
  if (!input) return {};

  const getAll = (key: string): string[] => {
    if (input instanceof URLSearchParams) return input.getAll(key);
    const v = (input as Record<string, string | string[] | undefined>)[key];
    if (v === undefined) return [];
    return Array.isArray(v) ? v : [v];
  };
  const getFirst = (key: string): string | undefined => {
    const all = getAll(key);
    return all.length > 0 ? all[0] : undefined;
  };

  const categoryRaw = getAll('category')
    .flatMap((v) => v.split(','))
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const limitN = toFiniteNumber(getFirst('limit'));
  const filter: IMarketplaceListingFilter = {};
  const q = getFirst('q')?.trim();
  if (q) filter.q = q;
  if (categoryRaw.length > 0) filter.category = categoryRaw;
  const pMin = toFiniteNumber(getFirst('priceMin'));
  if (pMin !== undefined) filter.priceMin = pMin;
  const pMax = toFiniteNumber(getFirst('priceMax'));
  if (pMax !== undefined) filter.priceMax = pMax;
  const cMin = toFiniteNumber(getFirst('commissionRateMin'));
  if (cMin !== undefined) filter.commissionRateMin = cMin;
  const region = getFirst('region')?.trim();
  if (region) filter.region = region;
  const cursor = getFirst('cursor')?.trim();
  if (cursor) filter.cursor = cursor;
  if (limitN !== undefined) filter.limit = normaliseLimit(limitN);

  // Sanity: priceMin must not exceed priceMax. When inverted, drop both
  // rather than silently mis-filter.
  if (
    filter.priceMin !== undefined &&
    filter.priceMax !== undefined &&
    filter.priceMin > filter.priceMax
  ) {
    delete filter.priceMin;
    delete filter.priceMax;
  }

  return filter;
}

/**
 * Encodes an IMarketplaceListingFilter into URLSearchParams. Undefined,
 * null, and empty values are omitted so the URL stays clean.
 *
 * Categories are emitted as repeated `category=` params.
 */
export function encodeFilterToSearchParams(
  filter: IMarketplaceListingFilter,
): URLSearchParams {
  const params = new URLSearchParams();

  if (filter.q && filter.q.trim()) params.set('q', filter.q.trim());
  if (filter.category && filter.category.length > 0) {
    for (const c of filter.category) {
      if (c && c.trim()) params.append('category', c.trim());
    }
  }
  if (filter.priceMin !== undefined && Number.isFinite(filter.priceMin)) {
    params.set('priceMin', String(filter.priceMin));
  }
  if (filter.priceMax !== undefined && Number.isFinite(filter.priceMax)) {
    params.set('priceMax', String(filter.priceMax));
  }
  if (
    filter.commissionRateMin !== undefined &&
    Number.isFinite(filter.commissionRateMin)
  ) {
    params.set('commissionRateMin', String(filter.commissionRateMin));
  }
  if (filter.region && filter.region.trim()) {
    params.set('region', filter.region.trim());
  }
  if (filter.cursor && filter.cursor.trim()) {
    params.set('cursor', filter.cursor.trim());
  }
  if (filter.limit !== undefined && Number.isFinite(filter.limit)) {
    params.set('limit', String(normaliseLimit(filter.limit)));
  }

  return params;
}

/**
 * Convenience: encode a filter to a `?…` URL suffix (or '' when empty).
 */
export function encodeFilterToQueryString(
  filter: IMarketplaceListingFilter,
): string {
  const params = encodeFilterToSearchParams(filter);
  const s = params.toString();
  return s.length === 0 ? '' : `?${s}`;
}

/**
 * Renders a commission percent for display. Defends against the
 * legacy 0–1 fractional encoding seen elsewhere in the codebase (some
 * older ProductV2 rows store commissionRate as `0.15` instead of `15`).
 *
 * Mirrors the heuristic in `services/publisher/__tests__/format-commission.mjs`.
 */
export function formatCommissionRate(rate: number | undefined | null): string {
  if (rate === undefined || rate === null || !Number.isFinite(rate)) {
    return 'Commission TBD';
  }
  const pct = rate <= 1 ? rate * 100 : rate;
  // Trim trailing zeros for whole numbers
  const formatted =
    Math.round(pct * 10) % 10 === 0
      ? Math.round(pct).toString()
      : pct.toFixed(1);
  return `${formatted}%`;
}

/**
 * Pretty-prints a listing price. Falls back to bare number when the
 * runtime can't resolve the locale (SSR cold start).
 */
export function formatListingPrice(
  price: number | undefined | null,
  currency: string | undefined | null,
): string {
  if (price === undefined || price === null || !Number.isFinite(price)) {
    return 'Price unavailable';
  }
  const cur = (currency || 'USD').toUpperCase();
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: cur,
    }).format(price);
  } catch {
    return `${cur} ${price.toFixed(2)}`;
  }
}

/**
 * Best-effort base origin for SSR fetch calls. Mirrors the helper in
 * `services/publisher/service.ts` so behaviour is consistent across
 * MARWAN-shipped surfaces.
 */
export function getRuntimeOrigin(): string {
  const envOrigin =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL;
  if (envOrigin) return envOrigin.replace(/\/$/, '');
  const port = process.env.PORT || '3000';
  return `http://127.0.0.1:${port}`;
}
