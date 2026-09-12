/**
 * shop-home-indexability.mjs — the ONE rule that decides whether a shop home
 * (`shop.droplinked.com/<shopUrl>`) may tell Google to index it.
 *
 * WHY THIS EXISTS (measured 2026-09-12)
 * ------------------------------------
 * `generateMetadata` for the one-segment shop branch returned
 * `robots: { index: true, follow: true }` for EVERY shop apiv3 could resolve,
 * with no content threshold of any kind. `apiv3.droplinked.com/seo/sitemap-
 * index.xml` advertises 5,736 per-shop sitemaps and each one includes the shop
 * home even at zero products, so the estate was actively inviting Google to
 * index thousands of pages whose entire body is a header, a raw database
 * handle as the <h1>/<title>, and an empty grid.
 *
 * That is the exact shape that got the legacy Google Merchant Center account
 * suspended for misrepresentation with the STOREFRONT — not the feed — as root
 * cause. The marketplace PDP already has a quality floor for the same reason
 * (`marketplacePdpIsIndexable`, mirrored in `marketplace-data.ts`); the shop
 * home had none. This module is that floor, for the shop-home layer.
 *
 * THE RULE — and the one distinction that matters more than the rule
 * ------------------------------------------------------------------
 * `noindex` is only ever emitted on POSITIVE evidence of emptiness: the
 * product-list call answered `ok` and reported a real, integral total of zero.
 *
 * Everything else FAILS OPEN to `index`. In particular a product list that was
 * `unavailable` — 429 / 408 / 5xx / network / malformed body, per
 * `@/lib/upstream/upstream-outcome.mjs` — must NEVER be able to produce a
 * `noindex`. apiv3 rate-limits anonymous traffic at 60 req/min/IP and every
 * SSR render costs one apiv3 fetch from a handful of egress IPs, so a parallel
 * crawl throttles itself; on 2026-09-08 exactly that throttle manufactured a
 * "67.5% of the sitemap is dead" reading against a real figure of 31 of
 * 11,957. A crawler must never be able to delist a working shop by crawling it
 * too fast. Emptiness is a fact about the SHOP; a throttle is a fact about the
 * MOMENT — the same distinction `upstream-outcome.mjs` exists to protect.
 *
 * `follow` stays TRUE even on `noindex`: an empty shop still carries header,
 * footer and brand links worth crawling, and we are suppressing a thin page,
 * not pruning the link graph.
 *
 * WHAT THIS RULE DELIBERATELY DOES NOT KEY ON (measured 2026-09-12)
 *   - `country`: null on every connector row sampled, INCLUDING shops that
 *     have products and work. It does not separate good from bad.
 *   - `description`: live data carries a bare image URL here (see
 *     `cleanDescription` in shop-home-data.ts, which already blanks it), so an
 *     empty description is a data-quality artefact, not evidence of a dead
 *     shop.
 *   Both would delist working shops. Product count is the only signal that
 *   actually tracks "is there anything on this page".
 *
 * SCOPE: this governs what the page EMITS from here on. It is not a delisting
 * sweep and it does not touch already-indexed URLs — retroactive treatment of
 * the ~5,400 live URLs is an operator decision with SEO consequences.
 *
 * Plain ESM on purpose: this repo's `npm test` is Node's built-in runner with
 * no TypeScript transform, and the rule is exercised by
 * `src/__smoke__/shop-home-indexability.smoke.test.mjs` against THIS module
 * (same pattern as `upstream-outcome.mjs` / `combine-outcomes.mjs`).
 */

/**
 * Where a shop home's product `total` came from. The view model cannot carry a
 * bare number: `fetchShopHome` deliberately degrades a product-list `absent`
 * into an empty grid so an existing shop still renders (the Store endpoint,
 * not the list, is the authority on existence). That makes `total === 0`
 * ambiguous on its own — COUNTED is what disambiguates it.
 */
export const CATALOG = Object.freeze({
  /** The product list answered `ok`. `total` is authoritative. */
  COUNTED: 'counted',
  /** The list did not answer `ok` (4xx). `total` is a render fallback, NOT evidence. */
  UNCOUNTED: 'uncounted',
});

/**
 * True only on positive, counted evidence that the shop home has no products.
 *
 * @param {{ catalog?: unknown, total?: unknown }} shop
 * @returns {boolean}
 */
export function shopHomeIsEmpty(shop) {
  if (!shop || typeof shop !== 'object') return false;
  if (shop.catalog !== CATALOG.COUNTED) return false;
  const total = shop.total;
  // A non-integer total is not a count. Never infer emptiness from it.
  if (typeof total !== 'number' || !Number.isInteger(total)) return false;
  return total === 0;
}

/**
 * The `robots` directive for a shop home, in Next's Metadata shape.
 *
 * @param {{ catalog?: unknown, total?: unknown }} shop
 * @returns {{ index: boolean, follow: boolean }}
 */
export function shopHomeRobots(shop) {
  return shopHomeIsEmpty(shop)
    ? { index: false, follow: true }
    : { index: true, follow: true };
}
