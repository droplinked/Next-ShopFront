/**
 * Shop-home indexability — the rule that decides whether
 * `shop.droplinked.com/<shopUrl>` invites Google to index it.
 *
 * This exercises THE REAL MODULE the page imports
 * (`@/lib/seo/shop-home-indexability.mjs`), not a copy of its rules, and it
 * pins the ONE distinction the whole change exists to protect:
 *
 *   counted + total 0  -> noindex, follow   (positive evidence of emptiness)
 *   counted + total >0 -> index,   follow   (a real shop)
 *   UNAVAILABLE        -> index,   follow   (fail OPEN — a throttle is not a
 *                                            fact about the shop)
 *
 * Runner: Node's built-in test runner (this repo has no jest/vitest).
 *   node --test src/__smoke__/shop-home-indexability.smoke.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import {
  CATALOG,
  shopHomeIsEmpty,
  shopHomeRobots,
} from '../lib/seo/shop-home-indexability.mjs';
import { OUTCOME, classifyUpstreamStatus } from '../lib/upstream/upstream-outcome.mjs';

/** A shop home view as the loader builds it, reduced to the fields the rule reads. */
function view({ catalog, total }) {
  return { catalog, total };
}

/**
 * THE OLD RULE, verbatim: `generateMetadata` returned this for EVERY shop
 * apiv3 could resolve. Kept as the failing-case control — it must disagree
 * with the new rule on an empty shop, or the drill does not bite.
 */
function legacyRobots() {
  return { index: true, follow: true };
}

// ---------------------------------------------------------------------------
// THE THREE CASES, ONE RUN
// ---------------------------------------------------------------------------

test('CASE 1 — a counted, genuinely empty shop emits noindex, follow', () => {
  const empty = view({ catalog: CATALOG.COUNTED, total: 0 });
  assert.equal(shopHomeIsEmpty(empty), true);
  assert.deepEqual(shopHomeRobots(empty), { index: false, follow: true });
  // follow stays TRUE — we suppress a thin page, we do not prune the link graph.
  assert.equal(shopHomeRobots(empty).follow, true);
  // Control: the rule we replaced really did index this page.
  assert.equal(legacyRobots().index, true);
  assert.notEqual(shopHomeRobots(empty).index, legacyRobots().index);
});

test('CASE 2 — a counted shop WITH products still emits index, follow', () => {
  for (const total of [1, 2, 56, 23_025]) {
    const stocked = view({ catalog: CATALOG.COUNTED, total });
    assert.equal(shopHomeIsEmpty(stocked), false, `total ${total}`);
    assert.deepEqual(shopHomeRobots(stocked), { index: true, follow: true }, `total ${total}`);
  }
});

test('CASE 3 — an UNAVAILABLE product list can never produce a noindex (fail OPEN)', () => {
  // Every status apiv3 can answer with that means "not right now, not
  // never" — 429 is the one that actually happens (60 req/min/IP).
  for (const status of [408, 425, 429, 500, 502, 503, 504]) {
    assert.equal(classifyUpstreamStatus(status), OUTCOME.UNAVAILABLE, `status ${status}`);
  }
  // An unavailable list never marks the catalogue counted, so total is not
  // evidence — the loader's fallback grid is `total: 0`, the worst case.
  const throttled = view({ catalog: CATALOG.UNCOUNTED, total: 0 });
  assert.equal(shopHomeIsEmpty(throttled), false);
  assert.deepEqual(shopHomeRobots(throttled), { index: true, follow: true });
  // This is the whole point: a crawler must not be able to delist a working
  // shop by crawling it too fast.
  assert.equal(shopHomeRobots(throttled).index, true);
});

// ---------------------------------------------------------------------------
// The page layer must not be able to lose case 3
// ---------------------------------------------------------------------------

test('the page throws on `unavailable` BEFORE it computes robots', () => {
  const src = readFileSync(
    fileURLToPath(new URL('../app/(routes)/[productId]/page.tsx', import.meta.url)),
    'utf8'
  );
  const guard = src.indexOf('throwIfUnavailable("shop home", result)');
  const decide = src.indexOf('shopHomeRobots(shop)');
  assert.ok(guard > -1, 'the unavailable guard must exist in the shop branch');
  assert.ok(decide > -1, 'the page must delegate robots to the shared rule');
  assert.ok(guard < decide, 'robots must never be computed before the unavailable guard');
  // And the page must not have kept a hardcoded index:true for the shop home.
  assert.equal(
    src.includes('robots: { index: true, follow: true }'),
    false,
    'the unconditional index:true must be gone from this route'
  );
});

// ---------------------------------------------------------------------------
// Fail-open on everything that is not a counted integer zero
// ---------------------------------------------------------------------------

test('anything that is not a counted integer zero fails OPEN to index', () => {
  const notEmpty = [
    undefined,
    null,
    {},
    { catalog: CATALOG.UNCOUNTED, total: 0 },
    { catalog: 'counted-ish', total: 0 },
    { catalog: CATALOG.COUNTED },                 // total missing
    { catalog: CATALOG.COUNTED, total: null },
    { catalog: CATALOG.COUNTED, total: '0' },     // a string is not a count
    { catalog: CATALOG.COUNTED, total: NaN },
    { catalog: CATALOG.COUNTED, total: 0.5 },
  ];
  let checked = 0;
  for (const shop of notEmpty) {
    assert.equal(shopHomeIsEmpty(shop), false, JSON.stringify(shop ?? String(shop)));
    assert.deepEqual(shopHomeRobots(shop), { index: true, follow: true });
    checked += 1;
  }
  assert.equal(checked, notEmpty.length); // control: the loop really ran
});

test('the loader marks the catalogue counted ONLY on an ok product list', () => {
  const src = readFileSync(
    fileURLToPath(
      new URL('../app/(routes)/[productId]/shop/lib/shop-home-data.ts', import.meta.url)
    ),
    'utf8'
  );
  assert.ok(src.includes('let catalog: CatalogProvenance = CATALOG.UNCOUNTED;'),
    'the provenance must default to UNCOUNTED');
  const okBranch = src.indexOf('if (listResult.outcome === "ok")');
  const promote = src.indexOf('catalog = CATALOG.COUNTED;');
  assert.ok(okBranch > -1 && promote > -1);
  assert.ok(promote > okBranch, 'COUNTED may only be set inside the ok branch');
  // Only ONE place may promote it.
  assert.equal(src.split('catalog = CATALOG.COUNTED;').length - 1, 1);
});

// ---------------------------------------------------------------------------
// Signals we deliberately do NOT key on (measured 2026-09-12)
// ---------------------------------------------------------------------------

test('country and description are NOT inputs to the rule', () => {
  // `country` is null on connector rows for shops that WORK, and live
  // descriptions carry a bare image URL. Keying on either would delist
  // working shops (see 2026-09-02: a rule derived from 88 broken rows would
  // have delisted 11 shops that work, mostly non-ASCII).
  const stockedButBlank = {
    catalog: CATALOG.COUNTED,
    total: 3,
    country: null,
    description: '',
    logoUrl: null,
  };
  assert.deepEqual(shopHomeRobots(stockedButBlank), { index: true, follow: true });

  const src = readFileSync(
    fileURLToPath(new URL('../lib/seo/shop-home-indexability.mjs', import.meta.url)),
    'utf8'
  );
  const code = src.slice(src.indexOf('export const CATALOG'));
  for (const forbidden of ['country', 'description', 'logoUrl', 'name']) {
    assert.equal(
      new RegExp(`shop\\.${forbidden}\\b`).test(code),
      false,
      `the rule must not read shop.${forbidden}`
    );
  }
  assert.ok(code.includes('shop.total'), 'control: it does read shop.total');
});

// ---------------------------------------------------------------------------
// Non-ASCII / spaced slugs are unaffected — the rule never sees a slug
// ---------------------------------------------------------------------------

test('the rule is slug-blind: non-ASCII and spaced shops are judged only on stock', () => {
  for (const shopUrl of ['椰子', 'tuấn linh-694419ba21fb9912776dae4b', 'hyped dogs-6928aa82']) {
    assert.deepEqual(
      shopHomeRobots({ shopUrl, catalog: CATALOG.COUNTED, total: 7 }),
      { index: true, follow: true },
      shopUrl
    );
    assert.deepEqual(
      shopHomeRobots({ shopUrl, catalog: CATALOG.COUNTED, total: 0 }),
      { index: false, follow: true },
      shopUrl
    );
  }
});
