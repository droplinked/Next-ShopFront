/**
 * Unit tests for the attestation lib helpers.
 *
 * Runner: node --test
 *
 * Mirrors the production `@/lib/attestation/attestation` module via the
 * sibling `.mjs` twin. Each test pins a contract the badge / verifier
 * UI depends on — a regression here is a regression there.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  attestationReasonLabel,
  chainIconSrc,
  chainLabel,
  confirmedChains,
  formatAttestedAt,
  hasAnyAttestationActivity,
  hasConfirmedAttestation,
  truncateHash,
} from './attestation.mjs';

// ---------- hasConfirmedAttestation ----------

test('hasConfirmedAttestation: null / undefined input -> false', () => {
  assert.equal(hasConfirmedAttestation(null), false);
  assert.equal(hasConfirmedAttestation(undefined), false);
});

test('hasConfirmedAttestation: both chains absent -> false', () => {
  const att = {
    avax: { status: 'absent' },
    base: { status: 'absent' },
  };
  assert.equal(hasConfirmedAttestation(att), false);
});

test('hasConfirmedAttestation: at least one confirmed -> true', () => {
  assert.equal(
    hasConfirmedAttestation({
      avax: { status: 'confirmed' },
      base: { status: 'absent' },
    }),
    true,
  );
  assert.equal(
    hasConfirmedAttestation({
      avax: { status: 'pending' },
      base: { status: 'confirmed' },
    }),
    true,
  );
});

test('hasConfirmedAttestation: pending-only -> false (badge does NOT render)', () => {
  assert.equal(
    hasConfirmedAttestation({
      avax: { status: 'pending' },
      base: { status: 'pending' },
    }),
    false,
  );
});

// ---------- hasAnyAttestationActivity ----------

test('hasAnyAttestationActivity: pending chain counts as activity', () => {
  assert.equal(
    hasAnyAttestationActivity({
      avax: { status: 'pending' },
      base: { status: 'absent' },
    }),
    true,
  );
});

test('hasAnyAttestationActivity: both absent -> false', () => {
  assert.equal(
    hasAnyAttestationActivity({
      avax: { status: 'absent' },
      base: { status: 'absent' },
    }),
    false,
  );
});

// ---------- confirmedChains ----------

test('confirmedChains: stable AVAX -> BASE ordering', () => {
  const att = {
    avax: { status: 'confirmed' },
    base: { status: 'confirmed' },
  };
  assert.deepEqual(confirmedChains(att), ['AVAX', 'BASE']);
});

test('confirmedChains: filters out non-confirmed chains', () => {
  assert.deepEqual(
    confirmedChains({
      avax: { status: 'pending' },
      base: { status: 'confirmed' },
    }),
    ['BASE'],
  );
});

test('confirmedChains: null input -> empty array', () => {
  assert.deepEqual(confirmedChains(null), []);
});

// ---------- truncateHash ----------

test('truncateHash: long hash truncated head/tail with ellipsis', () => {
  const long = '0x1234567890abcdef1234567890abcdef';
  assert.equal(truncateHash(long, 6, 4), '0x1234…cdef');
});

test('truncateHash: short hash is returned unchanged', () => {
  assert.equal(truncateHash('0x123', 6, 4), '0x123');
});

test('truncateHash: non-string input -> empty string (no crash)', () => {
  assert.equal(truncateHash(null), '');
  assert.equal(truncateHash(undefined), '');
  assert.equal(truncateHash(123), '');
});

// ---------- chainLabel / chainIconSrc ----------

test('chainLabel: AVAX -> Avalanche, BASE -> Base', () => {
  assert.equal(chainLabel('AVAX'), 'Avalanche');
  assert.equal(chainLabel('BASE'), 'Base');
});

test('chainIconSrc: AVAX -> avax.svg, BASE -> base.svg', () => {
  assert.equal(chainIconSrc('AVAX'), '/images/chains/avax.svg');
  assert.equal(chainIconSrc('BASE'), '/images/chains/base.svg');
});

test('chainIconSrc: unknown chain falls back to generic.svg', () => {
  assert.equal(chainIconSrc('SOL'), '/images/chains/generic.svg');
});

// ---------- formatAttestedAt ----------

test('formatAttestedAt: ISO string -> human-readable', () => {
  const out = formatAttestedAt('2026-05-29T12:00:00.000Z');
  // Locale-formatted, so just check it includes year + month
  assert.ok(out.length > 0);
  assert.match(out, /2026/);
});

test('formatAttestedAt: null / invalid -> empty string', () => {
  assert.equal(formatAttestedAt(null), '');
  assert.equal(formatAttestedAt(''), '');
  assert.equal(formatAttestedAt('not-a-date'), '');
});

// ---------- attestationReasonLabel ----------

test('attestationReasonLabel: known reasons -> friendly label', () => {
  assert.equal(attestationReasonLabel('INITIAL_PUBLISH'), 'Initial publish');
  assert.equal(
    attestationReasonLabel('COMMISSION_RATE_CHANGE'),
    'Commission rate change',
  );
  assert.equal(
    attestationReasonLabel('FRAUD_RULE_CHANGE'),
    'Fraud rule change',
  );
  assert.equal(
    attestationReasonLabel('TERMINATION_TERMS_CHANGE'),
    'Termination terms change',
  );
  assert.equal(attestationReasonLabel('MANUAL'), 'Manual re-attestation');
});

test('attestationReasonLabel: unknown reason falls back to generic', () => {
  assert.equal(attestationReasonLabel(null), 'Attestation');
  assert.equal(attestationReasonLabel('NEW_VARIANT'), 'Attestation');
});

// ---------- gating contract: badge appearance ----------

test('badge gating: confirmed-only triggers visible badge', () => {
  const att = {
    avax: { status: 'confirmed' },
    base: { status: 'absent' },
  };
  assert.equal(hasConfirmedAttestation(att), true);
  assert.equal(confirmedChains(att).length, 1);
});

test('badge gating: pending program does NOT show badge but DOES show verifier rows', () => {
  // The verifier landing shows pending rows; the marketplace badge
  // does not. Both predicates run on the same envelope — this is the
  // single-source-of-truth contract.
  const att = {
    avax: { status: 'pending' },
    base: { status: 'absent' },
  };
  assert.equal(hasConfirmedAttestation(att), false); // no badge
  assert.equal(hasAnyAttestationActivity(att), true); // verifier rows
});
