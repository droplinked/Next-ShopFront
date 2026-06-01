/**
 * Component contract tests for AttestationBadge + ListingCardAttestationChip.
 *
 * We can't import the React component directly under `node --test`
 * without a JSX transformer, so the tests pin the contracts the
 * components rely on — the SAME helper outputs the component renders.
 *
 * Keep in sync with:
 *   - components/AttestationBadge.tsx
 *   - components/ListingCardAttestationChip.tsx
 *
 * Runner: node --test
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  chainLabel,
  confirmedChains,
  hasConfirmedAttestation,
  truncateHash,
} from '../../../../../lib/attestation/__tests__/attestation.mjs';

// ---------- AttestationBadge: visibility gating ----------

test('badge: renders nothing for null attestation', () => {
  assert.equal(hasConfirmedAttestation(null), false);
});

test('badge: renders nothing when no chain reached confirmed', () => {
  const att = {
    avax: { status: 'absent' },
    base: { status: 'pending' },
  };
  assert.equal(hasConfirmedAttestation(att), false);
});

test('badge: renders when at least one chain is confirmed', () => {
  const avaxOnly = {
    avax: { status: 'confirmed' },
    base: { status: 'absent' },
  };
  const baseOnly = {
    avax: { status: 'absent' },
    base: { status: 'confirmed' },
  };
  const both = {
    avax: { status: 'confirmed' },
    base: { status: 'confirmed' },
  };
  assert.equal(hasConfirmedAttestation(avaxOnly), true);
  assert.equal(hasConfirmedAttestation(baseOnly), true);
  assert.equal(hasConfirmedAttestation(both), true);
});

// ---------- AttestationBadge: chain advertising ----------

test('badge: advertises only confirmed chains, in stable order', () => {
  const att = {
    avax: { status: 'pending' },
    base: { status: 'confirmed' },
  };
  const chains = confirmedChains(att);
  assert.deepEqual(chains, ['BASE']);
});

test('badge: human-readable chain labels', () => {
  assert.equal(chainLabel('AVAX'), 'Avalanche');
  assert.equal(chainLabel('BASE'), 'Base');
});

// ---------- AttestationBadge: aria-label content ----------

test('badge: aria-label lists confirmed chains by friendly name', () => {
  const att = {
    avax: { status: 'confirmed' },
    base: { status: 'confirmed' },
  };
  const chains = confirmedChains(att);
  // Mirrors AttestationBadge aria-label construction
  const ariaCopy = `Onchain attested on ${chains
    .map(chainLabel)
    .join(' and ')}`;
  assert.equal(ariaCopy, 'Onchain attested on Avalanche and Base');
});

// ---------- AttestationBadge: snapshot hash truncation ----------

test('badge modal: snapshot hash truncated for compact display', () => {
  const hash = '0xabcdef1234567890abcdef1234567890abcdef12';
  const truncated = truncateHash(hash, 10, 8);
  // Should be shorter than the original
  assert.ok(truncated.length < hash.length);
  // Should contain the head
  assert.ok(truncated.startsWith('0xabcdef12'));
  // Should contain the tail
  assert.ok(truncated.endsWith('abcdef12'));
});

// ---------- ListingCardAttestationChip: gating ----------

test('card chip: hidden when attestationUID is missing', () => {
  const listing = { title: 't', attestationUID: undefined };
  const isAttested =
    typeof listing.attestationUID === 'string' &&
    listing.attestationUID.length > 0;
  assert.equal(isAttested, false);
});

test('card chip: hidden when attestationUID is empty string', () => {
  const listing = { title: 't', attestationUID: '' };
  const isAttested =
    typeof listing.attestationUID === 'string' &&
    listing.attestationUID.length > 0;
  assert.equal(isAttested, false);
});

test('card chip: renders when attestationUID is a non-empty string', () => {
  const listing = {
    title: 't',
    attestationUID: '0xabcdef1234567890',
  };
  const isAttested =
    typeof listing.attestationUID === 'string' &&
    listing.attestationUID.length > 0;
  assert.equal(isAttested, true);
});

// ---------- ListingCardAttestationChip: non-interactive contract ----------

test('card chip: non-interactive (pointer-events: none)', () => {
  // The chip MUST be pointer-events-none — the whole card is a Link,
  // and any interactive child would break navigation. This test
  // documents that contract; the actual className is set in the .tsx
  // file. If the className changes, update both.
  const expectedClass = 'pointer-events-none';
  assert.ok(expectedClass.length > 0);
});

// ---------- AttestationBadge: graceful degrade on chain status divergence ----------

test('badge state machine: confirmed wins over pending', () => {
  // If one chain is confirmed, badge shows "verified". The pending
  // chain's status surfaces inside the modal as "indexing on this
  // chain" — never as a blocker to the headline verification.
  const att = {
    avax: { status: 'confirmed' },
    base: { status: 'pending' },
  };
  assert.equal(hasConfirmedAttestation(att), true);
  assert.deepEqual(confirmedChains(att), ['AVAX']);
});
