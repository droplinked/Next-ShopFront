/**
 * upstream-outcome.mjs — the ONE place that decides what an apiv3 response
 * MEANS for a server-rendered storefront page.
 *
 * WHY THIS EXISTS (measured 2026-09-09)
 * ------------------------------------
 * Every SSR loader in this repo collapsed "the upstream said no" into a single
 * `null`, and every page turned `null` into `notFound()`. apiv3 rate-limits
 * anonymous traffic per IP (60 req/min, `UserOrIpThrottlerGuard`), and every
 * SSR render costs one apiv3 fetch from a handful of egress IPs — so a
 * parallel crawl produced 429s, the page rendered a REAL HTTP 404, and the
 * ISR cache kept that 404 for an hour under
 * `cache-control: public, s-maxage=3600`. Googlebot re-crawled the cached 404
 * and Search Console reported "Not found (404): 573, validation FAILED" for
 * products that exist (78 URLs 404'd 12-wide; the same 78 returned 200
 * one-at-a-time).
 *
 * A 429 or a 5xx is NOT "this resource does not exist". This module gives the
 * distinction a name so no page can lose it again:
 *
 *   ok           2xx                           render it
 *   absent       4xx that describes the        notFound()  — a real, cacheable
 *                resource (404/410/400/403..)                404: the thing is gone
 *   unavailable  429 / 408 / 5xx / network /   throw       — an error response
 *                malformed body                              (5xx) that Next does
 *                                                            NOT cache and that
 *                                                            tells a crawler
 *                                                            "temporary, retry"
 *
 * Plain ESM on purpose: this repo's `npm test` is Node's built-in runner with
 * no TypeScript transform, and the rule is exercised by
 * `src/__smoke__/upstream-outcome.smoke.test.mjs` against THIS module (see
 * `src/lib/build-info.mjs` for the same pattern).
 */

/** The three things an upstream response can mean. */
export const OUTCOME = Object.freeze({
  OK: 'ok',
  ABSENT: 'absent',
  UNAVAILABLE: 'unavailable',
});

/**
 * 4xx statuses that do NOT describe the resource — they describe the moment
 * (this client, right now). They must never become a cached 404.
 */
const TRANSIENT_4XX = new Set([408, 425, 429]);

/**
 * Classify an HTTP status code.
 *
 * @param {unknown} status - the response status (anything non-numeric, e.g. a
 *   network failure with no response at all, is `unavailable`).
 * @returns {'ok'|'absent'|'unavailable'}
 */
export function classifyUpstreamStatus(status) {
  if (typeof status !== 'number' || !Number.isInteger(status)) {
    return OUTCOME.UNAVAILABLE;
  }
  if (status >= 200 && status < 300) return OUTCOME.OK;
  if (status >= 400 && status < 500) {
    return TRANSIENT_4XX.has(status) ? OUTCOME.UNAVAILABLE : OUTCOME.ABSENT;
  }
  // 1xx / 3xx (fetch follows redirects, so a 3xx here is an upstream that
  // could not be followed) and every 5xx.
  return OUTCOME.UNAVAILABLE;
}

/**
 * True when a page must NOT answer `notFound()` for this outcome — the only
 * question a page should ever ask.
 */
export function isUnavailable(outcome) {
  return outcome === OUTCOME.UNAVAILABLE;
}
