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
 * THE SECOND CONDITION — an email address in the handle (added 2026-09-12)
 * ------------------------------------------------------------------------
 * A shop home whose handle IS a customer's email address publishes that
 * address in the URL, and Google indexes the URL whatever the page says.
 * Measured on PROD, anonymous, no auth: `shop.droplinked.com/yg300211@
 * gmail.com` served HTTP 200 with `index, follow`, and apiv3's
 * `/shop/{handle}/structured-data` repeated the address in four more fields.
 * droplinked-backend #3848 closed the write sinks and its sibling substitutes
 * the NAME on the serving path — neither removes the handle, and neither
 * un-indexes what Google already has. This does.
 *
 * It is a separate condition, not a refinement of the emptiness one, because
 * the two rest on different kinds of evidence:
 *
 *   emptiness  — an OBSERVATION of an upstream call, which a throttle can
 *                corrupt, so it must be gated on `catalog === COUNTED`.
 *   the handle — a FACT about the URL this request arrived on. It is already
 *                in `params`; no fetch, no outcome, nothing a rate limit can
 *                manufacture. There is nothing to fail open FROM.
 *
 * So this condition applies to a STOCKED shop too. A shop with 40 products
 * and a customer's email address in its URL still must not be indexed under
 * that URL — the thin-page argument does not apply, but the privacy one does,
 * and the privacy one does not care how much stock is behind it.
 *
 * The predicate is the narrowest thing that is unambiguously an address, and
 * is a deliberate transcription of `publicShopNameIsEmailShaped` in
 * droplinked-backend `src/modules/shop/utils/public-shop-name.ts` (that module
 * is the source of truth; this is its ESM twin because the two run in
 * different repos and runtimes). Whole trimmed string, anchored both ends,
 * exactly one `@`, no whitespace, a dotted domain whose last label is 2+ ASCII
 * letters. Everything a real handle might plausibly do with an `@` therefore
 * stays indexed, byte-identical: live handles `nass2001@` and `abba@` have no
 * domain and are NOT addresses, and the 2026-09-02 non-ASCII delisting class
 * (`椰子`, `tuấn linh-…`) has no `@` at all.
 *
 * SCOPE: this governs what the page EMITS from here on. It is not a delisting
 * sweep and it does not touch already-indexed URLs — retroactive treatment of
 * the ~5,400 live URLs is an operator decision with SEO consequences. What it
 * DOES do is let Google drop the email-handled pages it has already crawled,
 * which is the only part of that retroactive question that is unambiguously
 * safe: it renames nothing, redirects nothing and breaks no inbound link.
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
 * Anchored, whole-string, single-`@`, no-whitespace, dotted-domain.
 *
 * `[^\s@]+` for the local part and for each domain label means a second `@`
 * anywhere fails the match, and `\s` anywhere fails the match — both on
 * purpose: a handle that merely CONTAINS an `@` is not an address.
 */
const EMAIL_SHAPED_HANDLE = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)*\.[A-Za-z]{2,}$/;

/**
 * True only when the WHOLE handle is an email address.
 *
 * Takes the handle, never the shop's display name: droplinked-backend now
 * substitutes an email NAME on the serving path, so by the time this page
 * renders, the name is already clean and the handle is the only surviving
 * copy. Reading the name here would silently stop working the day that
 * substitution ships.
 *
 * @param {unknown} handle the `shopUrl` segment this request arrived on
 * @returns {boolean}
 */
export function shopHandleIsEmailShaped(handle) {
  if (typeof handle !== 'string') return false;
  return EMAIL_SHAPED_HANDLE.test(handle.trim());
}

/**
 * The `robots` directive for a shop home, in Next's Metadata shape.
 *
 * Two independent reasons to withhold `index`, both emitting `follow: true`:
 *   1. the handle is a customer's email address (privacy — applies at ANY
 *      stock level, and needs no upstream evidence); or
 *   2. the shop is COUNTED empty (thin page — positive evidence only).
 *
 * @param {{ shopUrl?: unknown, catalog?: unknown, total?: unknown }} shop
 * @returns {{ index: boolean, follow: boolean }}
 */
export function shopHomeRobots(shop) {
  const handle = shop && typeof shop === 'object' ? shop.shopUrl : undefined;
  if (shopHandleIsEmailShaped(handle)) return { index: false, follow: true };
  return shopHomeIsEmpty(shop)
    ? { index: false, follow: true }
    : { index: true, follow: true };
}
