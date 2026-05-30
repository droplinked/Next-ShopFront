/**
 * Unit tests for the cost-comparator helpers.
 *
 * Covers:
 *  - spendBucket bucket boundaries
 *  - validateCalculatorInput happy + error paths
 *  - validateLeadCaptureInput happy + error paths
 *  - buildCalculatorPayload strips empty optional fields
 *  - formatUsd / formatUsdShort / formatSpeedMultiplier shape
 *  - NETWORK_PROFILES sanity (rates align with calculator)
 *
 * Runner: node --test
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  NETWORK_PROFILES,
  SUPPORTED_NETWORKS,
  buildCalculatorPayload,
  formatSpeedMultiplier,
  formatUsd,
  formatUsdShort,
  networkDisplayName,
  spendBucket,
  validateCalculatorInput,
  validateLeadCaptureInput,
} from './cost-comparator.mjs';

// ---------- spendBucket ----------

test('spendBucket: bucket boundaries', () => {
  assert.equal(spendBucket(0), 'lt-100k');
  assert.equal(spendBucket(99_999), 'lt-100k');
  assert.equal(spendBucket(100_000), '100k-500k');
  assert.equal(spendBucket(499_999), '100k-500k');
  assert.equal(spendBucket(500_000), '500k-1m');
  assert.equal(spendBucket(999_999), '500k-1m');
  assert.equal(spendBucket(1_000_000), '1m-5m');
  assert.equal(spendBucket(4_999_999), '1m-5m');
  assert.equal(spendBucket(5_000_000), '5m-plus');
  assert.equal(spendBucket(50_000_000), '5m-plus');
});

test('spendBucket: handles NaN and negative defensively', () => {
  // Non-finite or negative spend defaults to the smallest bucket so a
  // garbage input never silently classifies a merchant into the
  // highest-priority BD outreach cohort.
  assert.equal(spendBucket(NaN), 'lt-100k');
  assert.equal(spendBucket(-1), 'lt-100k');
  assert.equal(spendBucket(Infinity), 'lt-100k');
});

// ---------- validateCalculatorInput ----------

test('validateCalculatorInput: rejects missing network', () => {
  assert.equal(
    validateCalculatorInput({ annualSpendUsd: 1000 }),
    'Pick your current network.',
  );
});

test('validateCalculatorInput: rejects unsupported network', () => {
  assert.equal(
    validateCalculatorInput({ currentNetwork: 'cj', annualSpendUsd: 1000 }),
    'Pick a supported network (AWIN, Rakuten, or Impact).',
  );
});

test('validateCalculatorInput: rejects negative or non-numeric spend', () => {
  assert.equal(
    validateCalculatorInput({ currentNetwork: 'awin', annualSpendUsd: -1 }),
    'Enter your annual affiliate spend in USD.',
  );
  assert.equal(
    validateCalculatorInput({ currentNetwork: 'awin', annualSpendUsd: 'abc' }),
    'Enter your annual affiliate spend in USD.',
  );
});

test('validateCalculatorInput: rejects spend over $1B', () => {
  assert.equal(
    validateCalculatorInput({
      currentNetwork: 'awin',
      annualSpendUsd: 1_000_000_001,
    }),
    'Annual spend must be under $1B.',
  );
});

test('validateCalculatorInput: rejects commission rate outside 0-1', () => {
  assert.equal(
    validateCalculatorInput({
      currentNetwork: 'awin',
      annualSpendUsd: 1000,
      avgCommissionRate: 1.5,
    }),
    'Commission rate must be a fraction between 0 and 1 (e.g. 0.10).',
  );
});

test('validateCalculatorInput: accepts happy path with all fields', () => {
  assert.equal(
    validateCalculatorInput({
      currentNetwork: 'awin',
      annualSpendUsd: 1_000_000,
      avgCommissionRate: 0.1,
      monthlyTxCount: 1500,
    }),
    null,
  );
});

test('validateCalculatorInput: accepts happy path with minimum required fields', () => {
  assert.equal(
    validateCalculatorInput({
      currentNetwork: 'impact',
      annualSpendUsd: 500_000,
    }),
    null,
  );
});

// ---------- validateLeadCaptureInput ----------

test('validateLeadCaptureInput: rejects missing or malformed email', () => {
  assert.equal(
    validateLeadCaptureInput({ merchantName: 'Acme' }),
    'Enter a valid email.',
  );
  assert.equal(
    validateLeadCaptureInput({ merchantEmail: 'not-an-email', merchantName: 'Acme' }),
    'Enter a valid email.',
  );
});

test('validateLeadCaptureInput: rejects missing or whitespace-only name', () => {
  assert.equal(
    validateLeadCaptureInput({ merchantEmail: 'cfo@brand.example.com' }),
    'Enter your business name.',
  );
  assert.equal(
    validateLeadCaptureInput({
      merchantEmail: 'cfo@brand.example.com',
      merchantName: '   ',
    }),
    'Enter your business name.',
  );
});

test('validateLeadCaptureInput: accepts happy path', () => {
  assert.equal(
    validateLeadCaptureInput({
      merchantEmail: 'cfo@brand.example.com',
      merchantName: 'Acme Brand Co',
    }),
    null,
  );
});

// ---------- buildCalculatorPayload ----------

test('buildCalculatorPayload: strips empty optional fields', () => {
  const payload = buildCalculatorPayload({
    currentNetwork: 'awin',
    annualSpendUsd: '1000000',
    avgCommissionRate: '',
    monthlyTxCount: '',
  });
  assert.deepEqual(payload, {
    currentNetwork: 'awin',
    annualSpendUsd: 1_000_000,
  });
});

test('buildCalculatorPayload: includes optional fields when present', () => {
  const payload = buildCalculatorPayload({
    currentNetwork: 'impact',
    annualSpendUsd: '500000',
    avgCommissionRate: '0.08',
    monthlyTxCount: '2000',
  });
  assert.deepEqual(payload, {
    currentNetwork: 'impact',
    annualSpendUsd: 500_000,
    avgCommissionRate: 0.08,
    monthlyTxCount: 2000,
  });
});

// ---------- formatters ----------

test('formatUsd: drops cents above $1k', () => {
  assert.equal(formatUsd(290_000), '$290,000');
  assert.equal(formatUsd(1000), '$1,000');
  // below $1k keeps full precision
  assert.equal(formatUsd(123.45), '$123.45');
  assert.equal(formatUsd(0), '$0');
});

test('formatUsd: handles non-finite', () => {
  assert.equal(formatUsd(NaN), '$0');
  assert.equal(formatUsd(Infinity), '$0');
});

test('formatUsdShort: magnitude suffixes', () => {
  assert.equal(formatUsdShort(290_000), '$290k');
  assert.equal(formatUsdShort(1_300_000), '$1.3M');
  assert.equal(formatUsdShort(50_000_000), '$50M');
  assert.equal(formatUsdShort(2_500_000_000), '$2.5B');
  // below $10k falls back to formatUsd
  assert.equal(formatUsdShort(1500), '$1,500');
});

test('formatSpeedMultiplier: M× / k× shapes', () => {
  assert.equal(formatSpeedMultiplier(1_127_586.21), '1.13M×');
  assert.equal(formatSpeedMultiplier(15_000_000), '15M×');
  assert.equal(formatSpeedMultiplier(2500), '2.5k×');
  assert.equal(formatSpeedMultiplier(45), '45×');
  assert.equal(formatSpeedMultiplier(0), '0×');
  assert.equal(formatSpeedMultiplier(NaN), '0×');
});

// ---------- networkDisplayName ----------

test('networkDisplayName: maps known networks', () => {
  assert.equal(networkDisplayName('awin'), 'AWIN');
  assert.equal(networkDisplayName('impact'), 'Impact.com');
  assert.equal(networkDisplayName('rakuten'), 'Rakuten Advertising');
  assert.equal(networkDisplayName('droplinked'), 'droplinked');
});

test('networkDisplayName: tolerates uppercase + falls back gracefully', () => {
  assert.equal(networkDisplayName('AWIN'), 'AWIN');
  assert.equal(networkDisplayName('weirdco'), 'weirdco');
});

// ---------- NETWORK_PROFILES sanity ----------

test('NETWORK_PROFILES: contains all supported networks + droplinked', () => {
  const ids = NETWORK_PROFILES.map((p) => p.id);
  for (const n of SUPPORTED_NETWORKS) {
    assert.ok(
      ids.includes(n),
      `NETWORK_PROFILES missing supported network ${n}`,
    );
  }
  assert.ok(ids.includes('droplinked'), 'NETWORK_PROFILES missing droplinked');
});

test('NETWORK_PROFILES: droplinked has lower take-rate than all networks', () => {
  const dl = NETWORK_PROFILES.find((p) => p.id === 'droplinked');
  assert.ok(dl);
  for (const n of NETWORK_PROFILES.filter((p) => p.id !== 'droplinked')) {
    assert.ok(
      dl.takeRatePercent < n.takeRatePercent,
      `droplinked take-rate ${dl.takeRatePercent}% must be lower than ${n.id} ${n.takeRatePercent}%`,
    );
  }
});
