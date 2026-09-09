/**
 * Multi-source outcome precedence — the rule the interactive product page
 * (`/<productId>`) uses to decide 200 / 404 / 5xx BEFORE it sends a byte.
 *
 * This exercises THE REAL MODULE the loader imports
 * (`@/lib/upstream/combine-outcomes.mjs`), not a copy of its rules.
 *
 * Runner: Node's built-in test runner.
 *   node --test src/__smoke__/combine-outcomes.smoke.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  NO_SOURCE_ANSWERED_STATUS,
  combineSourceAnswers,
} from '../lib/upstream/combine-outcomes.mjs';

const sellable = { _id: 'p', skuIDs: [{ _id: 's' }] };
const titleOnly = { _id: 'p', skuIDs: [] };

const OK_COMPLETE = { outcome: 'ok', status: 200, body: sellable, complete: true };
const OK_PARTIAL = { outcome: 'ok', status: 200, body: titleOnly, complete: false };
const ABSENT_404 = { outcome: 'absent', status: 404 };
const ABSENT_400 = { outcome: 'absent', status: 400 };
const THROTTLED = { outcome: 'unavailable', status: 429, reason: 'http 429' };
const DOWN = { outcome: 'unavailable', status: 503, reason: 'http 503' };
const NETWORK = { outcome: 'unavailable', status: null, reason: 'network: ECONNRESET' };

/**
 * THE OLD RULE, verbatim in spirit: every source became `IProduct | null` and
 * the page did `if (!data) notFound()`. Kept ONLY as the failing-case control
 * — it must disagree with the new rule on a throttle.
 */
function legacyResolve(answers) {
  let partial = null;
  for (const a of answers) {
    if (a.outcome !== 'ok') continue; // <- the bug: 429 and 404 look the same
    if (a.complete) return a.body;
    partial = partial ?? a.body;
  }
  return partial; // null => notFound()
}

test('control: the fixtures are the shapes the loader really produces', () => {
  assert.equal(OK_COMPLETE.complete, true);
  assert.equal(OK_PARTIAL.complete, false);
  assert.equal(THROTTLED.outcome, 'unavailable');
  assert.equal(ABSENT_404.outcome, 'absent');
});

test('FAILING-CASE DRILL: a throttled source used to become a 404; now it is unavailable', () => {
  // Control: the legacy rule really does collapse a throttle into "not found".
  assert.equal(legacyResolve([THROTTLED]), null);
  assert.equal(legacyResolve([ABSENT_404, THROTTLED]), null);
  // The fix — and it is order-independent.
  assert.equal(combineSourceAnswers([THROTTLED]).outcome, 'unavailable');
  assert.equal(combineSourceAnswers([ABSENT_404, THROTTLED]).outcome, 'unavailable');
  assert.equal(combineSourceAnswers([THROTTLED, ABSENT_404]).outcome, 'unavailable');
  assert.equal(combineSourceAnswers([ABSENT_400, DOWN]).outcome, 'unavailable');
  assert.equal(combineSourceAnswers([NETWORK]).outcome, 'unavailable');
  // The first unavailable answer is the one reported (its status reaches Sentry).
  assert.equal(combineSourceAnswers([ABSENT_404, THROTTLED, DOWN]).status, 429);
});

test('a product no source knows is ABSENT — a real 404, exactly as before', () => {
  assert.deepEqual(combineSourceAnswers([ABSENT_404]), ABSENT_404);
  assert.deepEqual(combineSourceAnswers([ABSENT_404, ABSENT_404]), ABSENT_404);
  // Control: the legacy rule agrees here — the drill above is the ONLY
  // disagreement, so nothing that 404'd correctly before changes.
  assert.equal(legacyResolve([ABSENT_404]), null);
  // Every source threw / was skipped: a synthetic absent, never a throw.
  assert.deepEqual(combineSourceAnswers([]), {
    outcome: 'absent',
    status: NO_SOURCE_ANSWERED_STATUS,
  });
});

test('the working path is unchanged: first COMPLETE answer wins, in source order', () => {
  const other = { outcome: 'ok', status: 200, body: { _id: 'other', skuIDs: [{}] }, complete: true };
  assert.deepEqual(combineSourceAnswers([OK_COMPLETE, other]), {
    outcome: 'ok',
    status: 200,
    body: sellable,
  });
  // A later complete answer beats an earlier partial one (the old
  // `if (isSellable) return; partial = partial ?? p` loop did the same).
  assert.equal(combineSourceAnswers([OK_PARTIAL, OK_COMPLETE]).body, sellable);
  // Agreement with the legacy rule on every working input.
  for (const answers of [[OK_COMPLETE], [OK_PARTIAL, OK_COMPLETE], [ABSENT_404, OK_COMPLETE]]) {
    assert.equal(combineSourceAnswers(answers).body, legacyResolve(answers));
  }
});

test('a partial answer still renders (the product exists) even beside a throttle or a miss', () => {
  assert.equal(combineSourceAnswers([OK_PARTIAL, THROTTLED]).outcome, 'ok');
  assert.equal(combineSourceAnswers([THROTTLED, OK_PARTIAL]).body, titleOnly);
  assert.equal(combineSourceAnswers([OK_PARTIAL, ABSENT_404]).body, titleOnly);
  // The FIRST partial is kept when several sources are partial (as before).
  const laterPartial = { outcome: 'ok', status: 200, body: { _id: 'later', skuIDs: [] }, complete: false };
  assert.equal(combineSourceAnswers([OK_PARTIAL, laterPartial]).body, titleOnly);
});

test('garbage in the list is ignored, not thrown on', () => {
  assert.equal(combineSourceAnswers([null, undefined, 42, OK_COMPLETE]).outcome, 'ok');
  assert.equal(combineSourceAnswers([null]).outcome, 'absent');
});
