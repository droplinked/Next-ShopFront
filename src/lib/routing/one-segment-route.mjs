/**
 * one-segment-route.mjs — what `shop.droplinked.com/<oneSegment>` means.
 *
 * WHY THIS EXISTS (measured 2026-09-09)
 * ------------------------------------
 * The single-segment dynamic route `src/app/(routes)/[productId]/page.tsx`
 * only ever resolved a PRODUCT by ObjectId, so a shop home such as
 * `/roomours` fell through to the product loader, missed, and rendered as a
 * 200 `noindex` not-found page (59,658 bytes, `<title>droplinked</title>`) —
 * for every shop, including ones with products. Meanwhile apiv3 advertises
 * `https://shop.droplinked.com/{shopUrl}` as each shop's canonical Store URL
 * (`GET /shop/:shopUrl/structured-data`) and roots every product canonical
 * under it.
 *
 * THE PRECEDENCE RULE
 * -------------------
 * A segment is a PRODUCT ID iff it is a 24-character hex string (a Mongo
 * ObjectId). Everything else is a SHOP URL slug.
 *
 * This is not a heuristic — both namespaces enforce it:
 *   - apiv3 `GET /product-v2/public/:id` rejects any other shape with
 *     HTTP 400 "Invalid product id: must be a 24-char hex ObjectId" (measured),
 *     so a non-hex segment can NEVER be a product.
 *   - Of the 5,731 public shop slugs in the apiv3 sitemap-index on
 *     2026-09-09, ZERO match `^[0-9a-f]{24}$` (case-insensitive: also zero).
 *     Shop slugs are display-name-derived (`^[a-z0-9-]+$` at setup; live data
 *     also has `_`, `.`, `@`, spaces), and the 65 hex-only slugs that exist
 *     (`4444`, `acdc`, `1`, …) are never exactly 24 chars.
 *
 * So the two namespaces are disjoint in practice, and if a shop were ever
 * created with a 24-hex slug the PRODUCT interpretation wins — that is the
 * safer failure: it preserves every `/<productId>` link that works today
 * (the Buy-now bounce target of the SEO landing page, cart deep links), and a
 * shop owner can pick a slug; a product cannot change its ObjectId.
 *
 * Plain ESM so `src/__smoke__/one-segment-route.smoke.test.mjs` exercises
 * this exact module under Node's test runner (no TS transform in this repo).
 */

/** Mongo ObjectId: exactly 24 hex characters. */
export const PRODUCT_ID_PATTERN = /^[0-9a-f]{24}$/i;

/**
 * Characters that make a decoded segment un-servable as ONE shop slug: a `/`
 * (it could only have arrived percent-encoded, and apiv3's own
 * `isServableShopSlug` rejects it too) and the C0/DEL control range.
 * Whitespace is deliberately allowed — 11 live shops have a space in their
 * slug and resolve on apiv3 today (backend `canonical-url.util.ts`).
 */
// eslint-disable-next-line no-control-regex
const UNSERVABLE_SEGMENT = /[\/\x00-\x1f\x7f]/;

/**
 * Percent-decode a path segment the way a browser/crawler already did before
 * sending it. Next.js hands dynamic params decoded on most paths but not all
 * (older callers / manual encodes), so decoding is idempotent here: a segment
 * with no `%` is returned as-is, and a malformed escape falls back to the raw
 * value rather than throwing during render.
 *
 * @param {unknown} segment
 * @returns {string}
 */
export function decodeSegment(segment) {
  if (typeof segment !== 'string') return '';
  if (!segment.includes('%')) return segment;
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/**
 * Resolve what a one-segment path means.
 *
 * @param {unknown} segment - the raw `[productId]` param
 * @returns {{ kind: 'product-id', productId: string } | { kind: 'shop', shopUrl: string } | { kind: 'invalid' }}
 */
export function resolveOneSegmentRoute(segment) {
  const decoded = decodeSegment(segment).trim();
  if (decoded.length === 0) return { kind: 'invalid' };
  if (PRODUCT_ID_PATTERN.test(decoded)) {
    return { kind: 'product-id', productId: decoded };
  }
  if (UNSERVABLE_SEGMENT.test(decoded)) return { kind: 'invalid' };
  return { kind: 'shop', shopUrl: decoded };
}
