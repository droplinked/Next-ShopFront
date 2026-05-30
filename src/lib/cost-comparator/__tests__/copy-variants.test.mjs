/**
 * Tests for the copy-variant operator flip switch.
 *
 * Posture is a marketing decision; this verifies the env-var contract
 * the operator will flip without redeploying.
 *
 * Runner: node --test
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { HERO_COPY, getCopyVariant } from './copy-variants.mjs';

const ENV_VAR = 'NEXT_PUBLIC_COST_COMPARATOR_COPY_VARIANT';

test('getCopyVariant: defaults to alternative when env unset', () => {
  const original = process.env[ENV_VAR];
  delete process.env[ENV_VAR];
  try {
    assert.equal(getCopyVariant(), 'alternative');
  } finally {
    if (original !== undefined) process.env[ENV_VAR] = original;
  }
});

test('getCopyVariant: returns killer when env flipped', () => {
  const original = process.env[ENV_VAR];
  process.env[ENV_VAR] = 'killer';
  try {
    assert.equal(getCopyVariant(), 'killer');
  } finally {
    if (original === undefined) delete process.env[ENV_VAR];
    else process.env[ENV_VAR] = original;
  }
});

test('getCopyVariant: falls back to default on unknown values', () => {
  const original = process.env[ENV_VAR];
  process.env[ENV_VAR] = 'sledgehammer';
  try {
    assert.equal(getCopyVariant(), 'alternative');
  } finally {
    if (original === undefined) delete process.env[ENV_VAR];
    else process.env[ENV_VAR] = original;
  }
});

test('HERO_COPY: alternative variant is legally defensible (no "killing")', () => {
  // Defensive contract — operator wants alternative posture to be the
  // legally-safe default. Don't let a future commit silently put the
  // word "killing" into the alternative variant.
  assert.ok(!/killing/i.test(HERO_COPY.alternative.headline));
  assert.ok(!/killing/i.test(HERO_COPY.alternative.tagline));
});

test('HERO_COPY: both variants reference all three target networks', () => {
  for (const variant of ['alternative', 'killer']) {
    const all = `${HERO_COPY[variant].headline} ${HERO_COPY[variant].tagline}`;
    assert.ok(
      /awin/i.test(all),
      `${variant} variant must mention AWIN`,
    );
    assert.ok(
      /(impact|impact\.com)/i.test(all),
      `${variant} variant must mention Impact`,
    );
    assert.ok(
      /rakuten/i.test(all),
      `${variant} variant must mention Rakuten`,
    );
  }
});

test('HERO_COPY: every variant has all four required fields', () => {
  for (const variant of ['alternative', 'killer']) {
    const copy = HERO_COPY[variant];
    assert.ok(copy.headline?.length > 0, `${variant} missing headline`);
    assert.ok(copy.tagline?.length > 0, `${variant} missing tagline`);
    assert.ok(copy.ctaPrimary?.length > 0, `${variant} missing ctaPrimary`);
    assert.ok(copy.ctaSecondary?.length > 0, `${variant} missing ctaSecondary`);
  }
});
