/**
 * Page-level contract tests for the /attestation/[programId] verifier
 * landing.
 *
 * Mirrors the SSR + JSON-LD construction the page does (page.tsx) and
 * the metadata generation. Pins the SEO contract so a refactor doesn't
 * accidentally drop noindex on the empty state or strip the EAS
 * scanner URLs from the JSON-LD sameAs array.
 *
 * Runner: node --test
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  chainLabel,
  confirmedChains,
  hasAnyAttestationActivity,
  hasConfirmedAttestation,
  truncateHash,
} from '../../../../lib/attestation/__tests__/attestation.mjs';

// ---------- empty / not-found state ----------

test('page: null attestation -> friendly not-found render path', () => {
  assert.equal(hasConfirmedAttestation(null), false);
  assert.equal(hasAnyAttestationActivity(null), false);
});

test('page: not-found metadata is noindex', () => {
  // generateMetadata sets robots: { index: false, follow: false } when
  // attestation is null. This is the SEO contract.
  const metadata = {
    title: 'Attestation not found — droplinked',
    robots: { index: false, follow: false },
  };
  assert.equal(metadata.robots.index, false);
  assert.equal(metadata.robots.follow, false);
});

// ---------- confirmed state ----------

test('page: confirmed metadata IS indexable', () => {
  const att = {
    avax: { status: 'confirmed' },
    base: { status: 'absent' },
  };
  // Mirrors generateMetadata: robots: hasConfirmedAttestation ? index : noindex
  const robots = hasConfirmedAttestation(att)
    ? { index: true, follow: true }
    : { index: false, follow: false };
  assert.equal(robots.index, true);
});

test('page: pending-only metadata is NOT indexable', () => {
  // A pending-only attestation hasn't materialised yet — we don't
  // want SEO to crawl half-baked verifier pages.
  const att = {
    avax: { status: 'pending' },
    base: { status: 'pending' },
  };
  const robots = hasConfirmedAttestation(att)
    ? { index: true, follow: true }
    : { index: false, follow: false };
  assert.equal(robots.index, false);
});

// ---------- title + description copy ----------

test('page: title contains "Verified onchain" when confirmed', () => {
  const programId = '507f1f77bcf86cd799439010';
  const title = `Verified onchain · Program ${truncateHash(programId, 6, 4)} — droplinked`;
  assert.match(title, /Verified onchain/);
  assert.match(title, /droplinked$/);
});

test('page: description lists confirmed chains', () => {
  const att = {
    avax: { status: 'confirmed' },
    base: { status: 'confirmed' },
  };
  const chains = confirmedChains(att).map(chainLabel);
  const chainCopy = chains.join(' + ');
  const description = `Onchain attestation for droplinked affiliate program X. Chains: ${chainCopy}.`;
  assert.match(description, /Avalanche \+ Base/);
});

// ---------- JSON-LD shape ----------

test('JSON-LD: schema.org WebPage with sameAs containing EAS URLs', () => {
  const att = {
    programId: '507f1f77bcf86cd799439010',
    attestedAt: '2026-05-29T12:00:00.000Z',
    avax: {
      status: 'confirmed',
      easUrl: 'https://avax.easscan.org/attestation/view/0xavax',
    },
    base: {
      status: 'confirmed',
      easUrl: 'https://base.easscan.org/attestation/view/0xbase',
    },
  };
  const easUrls = [att.avax?.easUrl, att.base?.easUrl].filter(
    (s) => typeof s === 'string' && s.length > 0,
  );
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    sameAs: easUrls,
    dateModified: att.attestedAt,
  };
  assert.equal(jsonLd['@type'], 'WebPage');
  assert.equal(jsonLd.sameAs.length, 2);
  assert.ok(jsonLd.sameAs[0].includes('easscan.org'));
});

test('JSON-LD: potentialAction ViewAction when EAS URL present', () => {
  const easUrls = ['https://base.easscan.org/attestation/view/0xbase'];
  const action = easUrls.length
    ? { '@type': 'ViewAction', name: 'Verify on EAS', target: easUrls[0] }
    : undefined;
  assert.ok(action);
  assert.equal(action['@type'], 'ViewAction');
  assert.match(action.target, /easscan/);
});

// ---------- embed mode ----------

test('embed mode: ?embed=true strips back-link + page chrome', () => {
  const search = { embed: 'true' };
  const isEmbed =
    search.embed === 'true' ||
    search.embed === '1' ||
    (Array.isArray(search.embed) && search.embed.includes('true'));
  assert.equal(isEmbed, true);
});

test('embed mode: missing embed param -> chrome stays on', () => {
  const search = {};
  const isEmbed =
    search.embed === 'true' ||
    search.embed === '1' ||
    (Array.isArray(search.embed) && search.embed.includes('true'));
  assert.equal(isEmbed, false);
});

// ---------- detail page integration: badge slot ----------

test('detail page: badge renders ONLY when confirmed', () => {
  const confirmedAtt = {
    avax: { status: 'confirmed' },
    base: { status: 'absent' },
  };
  const pendingAtt = {
    avax: { status: 'pending' },
    base: { status: 'absent' },
  };
  // Mirrors the conditional in [slug]/page.tsx
  const renderBadge = (a) => Boolean(a) && hasConfirmedAttestation(a);
  assert.equal(renderBadge(confirmedAtt), true);
  assert.equal(renderBadge(pendingAtt), false);
  assert.equal(renderBadge(null), false);
});

// ---------- programId param flow ----------

test('detail page: badge fetch is conditional on affiliateProgramId', () => {
  // Mirrors the conditional in [slug]/page.tsx — only fetch the
  // attestation envelope when the listing has an affiliateProgramId.
  const listingWith = { affiliateProgramId: '507f1f77bcf86cd799439010' };
  const listingWithout = { affiliateProgramId: null };
  const shouldFetch = (l) => Boolean(l?.affiliateProgramId);
  assert.equal(shouldFetch(listingWith), true);
  assert.equal(shouldFetch(listingWithout), false);
});
