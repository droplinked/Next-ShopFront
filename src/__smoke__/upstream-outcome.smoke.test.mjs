/**
 * Upstream-outcome classification — the rule every SSR page depends on to
 * tell "this product does not exist" (a real, cacheable 404) from "apiv3 could
 * not answer right now" (never a 404, never cached).
 *
 * This exercises THE REAL MODULE the loaders import
 * (`@/lib/upstream/upstream-outcome.mjs`), not a copy of its rules.
 *
 * Runner: Node's built-in test runner (this repo has no jest/vitest).
 *   node --test src/__smoke__/upstream-outcome.smoke.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  OUTCOME,
  classifyUpstreamStatus,
  isUnavailable,
} from '../lib/upstream/upstream-outcome.mjs';

/**
 * THE OLD RULE, verbatim in spirit: every loader did `if (!response.ok)
 * return null` and every page did `if (!data) notFound()`. Kept here ONLY as
 * the failing-case control — it must disagree with the new rule on a 429.
 */
function legacyOutcome(status) {
  const ok = status >= 200 && status < 300;
  return ok ? OUTCOME.OK : OUTCOME.ABSENT; // <- the bug: 429 became "absent"
}

test('FAILING-CASE DRILL: the legacy rule turned a throttle into a 404; the new rule refuses to', () => {
  // Control: the legacy rule really does misclassify (proves the drill bites).
  assert.equal(legacyOutcome(429), OUTCOME.ABSENT);
  assert.equal(legacyOutcome(503), OUTCOME.ABSENT);
  // The fix.
  assert.equal(classifyUpstreamStatus(429), OUTCOME.UNAVAILABLE);
  assert.equal(classifyUpstreamStatus(503), OUTCOME.UNAVAILABLE);
  assert.notEqual(classifyUpstreamStatus(429), legacyOutcome(429));
});

test('2xx is ok', () => {
  for (const s of [200, 201, 204, 299]) assert.equal(classifyUpstreamStatus(s), OUTCOME.OK);
});

test('a 4xx that describes the RESOURCE is absent (a real 404 is still a 404)', () => {
  for (const s of [400, 401, 403, 404, 405, 410, 422]) {
    assert.equal(classifyUpstreamStatus(s), OUTCOME.ABSENT, `status ${s}`);
  }
});

test('a 4xx that describes the MOMENT is unavailable, never absent', () => {
  for (const s of [408, 425, 429]) {
    assert.equal(classifyUpstreamStatus(s), OUTCOME.UNAVAILABLE, `status ${s}`);
  }
});

test('every 5xx is unavailable', () => {
  let checked = 0;
  for (let s = 500; s <= 599; s += 1) {
    assert.equal(classifyUpstreamStatus(s), OUTCOME.UNAVAILABLE, `status ${s}`);
    checked += 1;
  }
  assert.equal(checked, 100); // the loop ran (a zero-iteration loop passes vacuously)
});

test('no response at all (network failure) is unavailable', () => {
  for (const v of [undefined, null, NaN, 'timeout', 200.5]) {
    assert.equal(classifyUpstreamStatus(v), OUTCOME.UNAVAILABLE, String(v));
  }
});

test('1xx / 3xx that fetch could not resolve are unavailable, not absent', () => {
  for (const s of [100, 301, 302, 304]) {
    assert.equal(classifyUpstreamStatus(s), OUTCOME.UNAVAILABLE, `status ${s}`);
  }
});

test('isUnavailable is the only question a page asks', () => {
  assert.equal(isUnavailable(OUTCOME.UNAVAILABLE), true);
  assert.equal(isUnavailable(OUTCOME.ABSENT), false);
  assert.equal(isUnavailable(OUTCOME.OK), false);
});

test('the outcome vocabulary is closed', () => {
  assert.deepEqual(Object.values(OUTCOME).sort(), ['absent', 'ok', 'unavailable']);
  assert.ok(Object.isFrozen(OUTCOME));
});
