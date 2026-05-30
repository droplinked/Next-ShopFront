/**
 * Pure JS twin of `@/lib/marketplace/marketplace`. Mirrors the encode /
 * decode / format helpers so node --test can exercise them without the
 * TypeScript + Next.js import graph.
 *
 * Keep in sync with marketplace.ts — any divergence is a test failure.
 */

const MARKETPLACE_DEFAULT_LIMIT = 24;
const MARKETPLACE_MAX_LIMIT = 100;

function toFiniteNumber(value) {
  if (value === null || value === undefined) return undefined;
  if (value === '') return undefined;
  const n = Number(value);
  if (!Number.isFinite(n)) return undefined;
  if (n < 0) return undefined;
  return n;
}

function normaliseLimit(value) {
  if (value === undefined) return MARKETPLACE_DEFAULT_LIMIT;
  if (!Number.isFinite(value) || value < 1) return MARKETPLACE_DEFAULT_LIMIT;
  if (value > MARKETPLACE_MAX_LIMIT) return MARKETPLACE_MAX_LIMIT;
  return Math.floor(value);
}

export function decodeFilterFromSearchParams(input) {
  if (!input) return {};

  const getAll = (key) => {
    if (input instanceof URLSearchParams) return input.getAll(key);
    const v = input[key];
    if (v === undefined) return [];
    return Array.isArray(v) ? v : [v];
  };
  const getFirst = (key) => {
    const all = getAll(key);
    return all.length > 0 ? all[0] : undefined;
  };

  const categoryRaw = getAll('category')
    .flatMap((v) => String(v).split(','))
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const limitN = toFiniteNumber(getFirst('limit'));
  const filter = {};
  const q = (getFirst('q') || '').trim();
  if (q) filter.q = q;
  if (categoryRaw.length > 0) filter.category = categoryRaw;
  const pMin = toFiniteNumber(getFirst('priceMin'));
  if (pMin !== undefined) filter.priceMin = pMin;
  const pMax = toFiniteNumber(getFirst('priceMax'));
  if (pMax !== undefined) filter.priceMax = pMax;
  const cMin = toFiniteNumber(getFirst('commissionRateMin'));
  if (cMin !== undefined) filter.commissionRateMin = cMin;
  const region = (getFirst('region') || '').trim();
  if (region) filter.region = region;
  const cursor = (getFirst('cursor') || '').trim();
  if (cursor) filter.cursor = cursor;
  if (limitN !== undefined) filter.limit = normaliseLimit(limitN);

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

export function encodeFilterToSearchParams(filter) {
  const params = new URLSearchParams();
  if (!filter) return params;

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

export function encodeFilterToQueryString(filter) {
  const params = encodeFilterToSearchParams(filter);
  const s = params.toString();
  return s.length === 0 ? '' : `?${s}`;
}

export function formatCommissionRate(rate) {
  if (rate === undefined || rate === null || !Number.isFinite(rate)) {
    return 'Commission TBD';
  }
  const pct = rate <= 1 ? rate * 100 : rate;
  const formatted =
    Math.round(pct * 10) % 10 === 0
      ? Math.round(pct).toString()
      : pct.toFixed(1);
  return `${formatted}%`;
}

export function formatListingPrice(price, currency) {
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

export { MARKETPLACE_DEFAULT_LIMIT, MARKETPLACE_MAX_LIMIT };
