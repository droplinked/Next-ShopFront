/**
 * Pure JS twin of src/lib/cost-comparator/analytics.ts — bucket
 * helpers only, since the emit() side of the module depends on
 * `window` (browser-only).
 *
 * Keep in lockstep with the TS source.
 */

import { spendBucket } from './cost-comparator.mjs';

export function savingsBucket(savings) {
  if (!Number.isFinite(savings) || savings < 25_000) return 'lt-25k';
  if (savings < 100_000) return '25k-100k';
  if (savings < 500_000) return '100k-500k';
  if (savings < 1_000_000) return '500k-1m';
  return '1m-plus';
}

/**
 * Recorder-style helper: returns a fake `window` that captures every
 * dataLayer.push + posthog.capture call so the test can assert on it.
 * Mirrors the contract of the TS `emit()` function below.
 */
export function createRecorder() {
  const dataLayerCalls = [];
  const posthogCalls = [];
  const fakeWindow = {
    dataLayer: { push: (e) => dataLayerCalls.push(e) },
    posthog: { capture: (event, props) => posthogCalls.push({ event, props }) },
  };
  return { fakeWindow, dataLayerCalls, posthogCalls };
}

/**
 * In-test mirror of `emit()` from analytics.ts. The real emit takes
 * `window` from the global; here we inject it so the test runner
 * doesn't need a DOM.
 */
export function emit(win, eventName, props) {
  try {
    win.dataLayer?.push({ event: eventName, ...props });
  } catch {
    /* swallow */
  }
  try {
    win.posthog?.capture(eventName, props);
  } catch {
    /* swallow */
  }
}

export function trackCalculatorSubmit(win, input) {
  emit(win, 'cost_comparator_calculator_submit', {
    network: input.currentNetwork,
    spend_bucket: spendBucket(input.annualSpendUsd),
    surface: 'affiliate-vs-networks',
  });
}
