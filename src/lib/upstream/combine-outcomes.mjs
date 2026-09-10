/**
 * combine-outcomes.mjs — the ONE rule for a page that can answer a request
 * from MORE THAN ONE upstream source (the interactive product page tries a
 * shop-scoped legacy endpoint, then the public product-v2 endpoint, then —
 * on a dev deploy — the prod product-v2 endpoint).
 *
 * WHY THIS EXISTS (measured 2026-09-09)
 * ------------------------------------
 * `getInteractiveProduct` folded every source into `IProduct | null`, so the
 * page could not tell "no source knows this product" (a real 404) from
 * "a source was throttled" (never a 404). Worse, the page then called
 * `notFound()` INSIDE a `<Suspense>` boundary, after the 200 shell had
 * already been flushed: `shop.droplinked.com/000000000000000000000000` was
 * HTTP 200, 59,706 bytes, `<meta name="robots" content="noindex">` — a
 * soft 404 no status-code monitor can see. The status must be decided
 * BEFORE any byte is sent, and it must be decided from OUTCOMES, not nulls.
 *
 * THE RULE (in order)
 *   1. the first COMPLETE `ok` answer wins          → render it
 *   2. else the first PARTIAL `ok` answer            → render it (the product
 *      exists — it just has nothing sellable right now)
 *   3. else, if ANY source was `unavailable`         → unavailable (a 5xx,
 *      never a 404: some source might know the product once it answers)
 *   4. else                                          → absent (a real 404)
 *
 * 1–2 are the pre-existing "first sellable wins, partial as a last resort"
 * precedence, unchanged. 3–4 are new: they are what lets the page answer the
 * right status code. A source that THREW (the legacy client throws on any
 * non-2xx and on a missing shop identity) is not an answer and is simply not
 * in the list — that keeps today's fail-open behaviour for it.
 *
 * Plain ESM on purpose: this repo's `npm test` is Node's built-in runner with
 * no TypeScript transform, and the rule is exercised by
 * `src/__smoke__/combine-outcomes.smoke.test.mjs` against THIS module.
 */

import { OUTCOME } from './upstream-outcome.mjs';

/**
 * @template T
 * @typedef {{ outcome: 'ok', status: number, body: T, complete: boolean }} SourceOk
 */
/** @typedef {{ outcome: 'absent', status: number }} SourceAbsent */
/** @typedef {{ outcome: 'unavailable', status: number | null, reason: string }} SourceUnavailable */
/**
 * @template T
 * @typedef {SourceOk<T> | SourceAbsent | SourceUnavailable} SourceAnswer
 */

/**
 * Status recorded on the synthetic `absent` returned when NO source answered
 * at all (every source threw / was skipped). It is what the page turns into
 * `notFound()`, which is exactly what it did before for that case.
 */
export const NO_SOURCE_ANSWERED_STATUS = 404;

/**
 * Combine the ordered answers of several sources into one outcome.
 *
 * @template T
 * @param {ReadonlyArray<SourceAnswer<T>>} answers - in source-priority order
 * @returns {{ outcome: 'ok', status: number, body: T } | SourceAbsent | SourceUnavailable}
 */
export function combineSourceAnswers(answers) {
  /** @type {SourceOk<T> | null} */
  let partial = null;
  /** @type {SourceUnavailable | null} */
  let unavailable = null;
  /** @type {SourceAbsent | null} */
  let absent = null;

  for (const answer of answers) {
    if (!answer || typeof answer !== 'object') continue;
    if (answer.outcome === OUTCOME.OK) {
      if (answer.complete) {
        return { outcome: OUTCOME.OK, status: answer.status, body: answer.body };
      }
      partial = partial ?? answer;
    } else if (answer.outcome === OUTCOME.UNAVAILABLE) {
      unavailable = unavailable ?? answer;
    } else if (answer.outcome === OUTCOME.ABSENT) {
      absent = absent ?? answer;
    }
  }

  if (partial) return { outcome: OUTCOME.OK, status: partial.status, body: partial.body };
  if (unavailable) return unavailable;
  if (absent) return absent;
  return { outcome: OUTCOME.ABSENT, status: NO_SOURCE_ANSWERED_STATUS };
}
