/**
 * Tests for analytics helpers — bucket math + emit contract.
 *
 * The real `analytics.ts` calls `window.dataLayer.push` and
 * `window.posthog.capture`. We mirror that contract with an injectable
 * `win` argument so the test runner doesn't need jsdom.
 *
 * Runner: node --test
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  createRecorder,
  emit,
  savingsBucket,
  trackCalculatorSubmit,
} from './analytics.mjs';

// ---------- savingsBucket ----------

test('savingsBucket: bucket boundaries', () => {
  assert.equal(savingsBucket(0), 'lt-25k');
  assert.equal(savingsBucket(24_999), 'lt-25k');
  assert.equal(savingsBucket(25_000), '25k-100k');
  assert.equal(savingsBucket(99_999), '25k-100k');
  assert.equal(savingsBucket(100_000), '100k-500k');
  assert.equal(savingsBucket(499_999), '100k-500k');
  assert.equal(savingsBucket(500_000), '500k-1m');
  assert.equal(savingsBucket(999_999), '500k-1m');
  assert.equal(savingsBucket(1_000_000), '1m-plus');
});

test('savingsBucket: handles NaN', () => {
  assert.equal(savingsBucket(NaN), 'lt-25k');
});

// ---------- emit ----------

test('emit: pushes to both dataLayer and posthog', () => {
  const { fakeWindow, dataLayerCalls, posthogCalls } = createRecorder();
  emit(fakeWindow, 'test_event', { foo: 'bar' });
  assert.equal(dataLayerCalls.length, 1);
  assert.deepEqual(dataLayerCalls[0], { event: 'test_event', foo: 'bar' });
  assert.equal(posthogCalls.length, 1);
  assert.deepEqual(posthogCalls[0], {
    event: 'test_event',
    props: { foo: 'bar' },
  });
});

test('emit: tolerates missing dataLayer and posthog', () => {
  // No tracker installed — must not throw
  assert.doesNotThrow(() => emit({}, 'orphan_event', { foo: 1 }));
});

test('emit: swallows errors from broken trackers', () => {
  const brokenWindow = {
    dataLayer: { push: () => { throw new Error('boom'); } },
    posthog: { capture: () => { throw new Error('boom2'); } },
  };
  assert.doesNotThrow(() => emit(brokenWindow, 'broken_event', {}));
});

// ---------- trackCalculatorSubmit ----------

test('trackCalculatorSubmit: emits correct payload shape (NEVER raw spend)', () => {
  const { fakeWindow, dataLayerCalls } = createRecorder();
  trackCalculatorSubmit(fakeWindow, {
    currentNetwork: 'awin',
    annualSpendUsd: 1_000_000,
  });
  assert.equal(dataLayerCalls.length, 1);
  const payload = dataLayerCalls[0];
  assert.equal(payload.event, 'cost_comparator_calculator_submit');
  assert.equal(payload.network, 'awin');
  // CRITICAL: bucket, never the raw spend. Defends the anonymity promise.
  assert.equal(payload.spend_bucket, '1m-5m');
  assert.equal(payload.surface, 'affiliate-vs-networks');
  assert.equal(payload.annual_spend_usd, undefined);
});
