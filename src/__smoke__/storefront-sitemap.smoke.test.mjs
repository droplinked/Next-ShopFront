/**
 * Storefront sitemap / robots plane — the rules `GET /sitemap.xml` and
 * `GET /robots.txt` depend on.
 *
 * This exercises THE REAL MODULE the routes import
 * (`@/lib/seo/storefront-sitemap.mjs`), not a copy of its rules, and it
 * checks the manifest against the FILESYSTEM: every advertised path must be
 * a `page.tsx` under `src/app`, so the sitemap cannot list a route that does
 * not exist (route groups like `(routes)` do not appear in the URL).
 *
 * Runner: Node's built-in test runner.
 *   node --test src/__smoke__/storefront-sitemap.smoke.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  SHOP_SITEMAP_INDEX_URL,
  STOREFRONT_STATIC_ROUTES,
  buildStorefrontSitemap,
  originOf,
  partitionByHost,
} from '../lib/seo/storefront-sitemap.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP_DIR = path.resolve(HERE, '..', 'app');
const SITE_TS = path.resolve(HERE, '..', 'lib', 'site.ts');

/** The host the app is served on — pinned here AND read back from site.ts. */
const SERVED = 'https://shop.droplinked.com';
/** The host the old sitemap.ts emitted on (the defect). */
const FOREIGN = 'https://droplinked.com';

/**
 * Every URL path served by a `page.tsx` under src/app, with route-group
 * segments `(name)` removed. Dynamic segments are kept verbatim (`[x]`) so
 * they can never accidentally match a static manifest path.
 */
function servedStaticPaths() {
  const found = new Set();
  const walk = (dir, segments) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        const isGroup = /^\(.*\)$/.test(entry.name);
        walk(path.join(dir, entry.name), isGroup ? segments : [...segments, entry.name]);
      } else if (entry.name === 'page.tsx') {
        found.add('/' + segments.join('/'));
      }
    }
  };
  walk(APP_DIR, []);
  return found;
}

test('control: the manifest is non-empty and the app tree is where we think it is', () => {
  assert.ok(STOREFRONT_STATIC_ROUTES.length >= 5, 'manifest too small to be real');
  const paths = servedStaticPaths();
  // Known pages that MUST be found, or the walker is looking at nothing.
  assert.ok(paths.has('/'), 'src/app/page.tsx not found by the walker');
  assert.ok(paths.has('/marketplace'), 'src/app/(routes)/marketplace/page.tsx not found');
  assert.ok(paths.size >= 15, `only ${paths.size} pages found`);
});

test('every advertised path is served by a real page.tsx (route groups collapsed)', () => {
  const paths = servedStaticPaths();
  let checked = 0;
  for (const route of STOREFRONT_STATIC_ROUTES) {
    assert.ok(paths.has(route.path), `no page.tsx serves ${route.path}`);
    assert.match(route.path, /^\/[a-z0-9-]*$/, `not a static one-segment path: ${route.path}`);
    checked += 1;
  }
  assert.equal(checked, STOREFRONT_STATIC_ROUTES.length);
  // Deny-proof for THIS check: a path nobody serves is rejected by the same
  // predicate, so a green run above means the paths exist, not that the
  // predicate is vacuous.
  assert.equal(paths.has('/this-route-does-not-exist'), false);
  assert.equal(paths.has('/(routes)/marketplace'), false, 'route group leaked into a path');
});

test('the served host pinned here is the SITE_URL the app really uses', () => {
  const src = fs.readFileSync(SITE_TS, 'utf8');
  // Exact substring, NOT a regex built from a hostname.
  //
  // The previous form hand-escaped only dots (`SERVED.replace(/[.]/g, '\\.')`),
  // which CodeQL flagged twice as high severity: js/incomplete-hostname-regexp
  // and js/incomplete-sanitization. Both are right. Escaping one metacharacter
  // class by hand is a loop you keep losing, and here it also weakened the very
  // property this test exists to prove — an unescaped `.` matches any character,
  // so `shop.droplinked.com` would also match `shopXdroplinkedYcom`. A test
  // asserting we are on the RIGHT host must not accept a wrong one.
  //
  // `includes` needs no escaping, cannot drift, and is strictly more precise.
  assert.ok(
    src.includes(`SITE_URL = "${SERVED}"`),
    `site.ts must pin SITE_URL to ${SERVED}`,
  );
});

test('every built entry is on the served origin; the root follows the catalog flag', () => {
  const now = new Date('2026-09-09T00:00:00.000Z');
  const on = buildStorefrontSitemap({ baseUrl: SERVED, rootCatalogEnabled: true, now });
  const off = buildStorefrontSitemap({ baseUrl: SERVED, rootCatalogEnabled: false, now });
  assert.equal(on.length, STOREFRONT_STATIC_ROUTES.length);
  assert.equal(off.length, STOREFRONT_STATIC_ROUTES.length - 1);
  assert.ok(on.some((e) => e.url === `${SERVED}/`));
  assert.ok(!off.some((e) => e.url === `${SERVED}/`), 'root listed while it redirects');
  for (const entry of on) {
    assert.equal(new URL(entry.url).origin, SERVED, entry.url);
    assert.equal(entry.lastModified, now);
    assert.ok(entry.priority > 0 && entry.priority <= 1);
  }
  // No duplicates, and a trailing-slash base does not double the slash.
  assert.equal(new Set(on.map((e) => e.url)).size, on.length);
  const slashed = buildStorefrontSitemap({ baseUrl: `${SERVED}/`, rootCatalogEnabled: true, now });
  assert.deepEqual(slashed.map((e) => e.url), on.map((e) => e.url));
});

test('FAILING-CASE DRILL: the host guard drops the exact <loc>s prod served, keeps the good ones', () => {
  // The two entries shop.droplinked.com/sitemap.xml emitted on 2026-09-09.
  const prodDefect = [
    { url: `${FOREIGN}/` },
    { url: `${FOREIGN}/claim-your-shop` },
  ];
  const good = [{ url: `${SERVED}/marketplace` }, { url: `${SERVED}/claim-your-shop` }];
  const junk = [{ url: 'not a url' }, { url: '' }];

  const { kept, rejected } = partitionByHost([...prodDefect, ...good, ...junk], SERVED);
  assert.deepEqual(kept, good, 'a good entry was dropped or a bad one kept');
  assert.equal(rejected.length, prodDefect.length + junk.length);

  // The whole old configuration — built on the marketing host — is denied
  // entirely, not partially.
  const oldConfig = buildStorefrontSitemap({ baseUrl: FOREIGN, rootCatalogEnabled: true });
  const oldSplit = partitionByHost(oldConfig, SERVED);
  assert.equal(oldSplit.kept.length, 0);
  assert.equal(oldSplit.rejected.length, oldConfig.length);

  // Control, same run: the new configuration passes the same guard in full.
  const newConfig = buildStorefrontSitemap({ baseUrl: SERVED, rootCatalogEnabled: true });
  const newSplit = partitionByHost(newConfig, SERVED);
  assert.equal(newSplit.rejected.length, 0);
  assert.equal(newSplit.kept.length, newConfig.length);
});

test('a misconfigured base URL fails loudly instead of publishing a sitemap on nothing', () => {
  assert.throws(() => originOf('shop.droplinked.com'), /Invalid URL/);
  assert.throws(() => buildStorefrontSitemap({ baseUrl: '', rootCatalogEnabled: true }));
  assert.equal(originOf('https://shop.droplinked.com/anything?x=1'), SERVED);
});

test('robots advertises the backend sitemap index on the host that actually serves it', () => {
  const u = new URL(SHOP_SITEMAP_INDEX_URL);
  assert.equal(u.protocol, 'https:');
  assert.equal(u.host, 'apiv3.droplinked.com');
  assert.equal(u.pathname, '/seo/sitemap-index.xml');
});
