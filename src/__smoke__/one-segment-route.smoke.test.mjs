/**
 * `/<oneSegment>` precedence — product-by-ObjectId vs shop home.
 *
 * This exercises THE REAL MODULE the route imports
 * (`@/lib/routing/one-segment-route.mjs`). The fixtures below are LIVE slugs
 * and ids copied from the apiv3 sitemap-index / product list on 2026-09-09,
 * so the tests assert against inputs that WORK today, not only against the
 * broken ones.
 *
 * Runner: Node's built-in test runner.
 *   node --test src/__smoke__/one-segment-route.smoke.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  PRODUCT_ID_PATTERN,
  decodeSegment,
  resolveOneSegmentRoute,
} from '../lib/routing/one-segment-route.mjs';

/** A real product id (roomours, first grid item, 2026-09-09). */
const LIVE_PRODUCT_ID = '68779a71c1e177c08666dd7e';

/**
 * Live public shop slugs, deliberately including the shapes that stress the
 * rule: plain, hex-looking-but-short, underscore/dot, email-like, and the
 * embedded-ObjectId + space shape the backend documents as resolving today.
 */
const LIVE_SHOP_SLUGS = [
  'roomours',
  'flower',
  'lisa',
  '4444', // hex-only, 4 chars
  'acdc', // hex-only, 4 chars
  '1', // hex-only, 1 char
  'fcfcfc', // hex-only, 6 chars
  'rapha.btc',
  'mammado_',
  'swissborg_shop',
  'hyped dogs-6928aa8205c8819a2dd672c7', // space + a 24-hex SUFFIX
  'mashcreative@gmail.com',
];

test('control: the fixture lists are non-empty (a vacuous loop passes for free)', () => {
  assert.ok(LIVE_SHOP_SLUGS.length >= 10);
  assert.match(LIVE_PRODUCT_ID, PRODUCT_ID_PATTERN);
});

test('a 24-hex segment is a product id (the route that works today keeps working)', () => {
  assert.deepEqual(resolveOneSegmentRoute(LIVE_PRODUCT_ID), {
    kind: 'product-id',
    productId: LIVE_PRODUCT_ID,
  });
  // Case-insensitive: Mongo renders lower-case, but a pasted upper-case id is
  // the same ObjectId and apiv3 accepts it.
  assert.equal(resolveOneSegmentRoute(LIVE_PRODUCT_ID.toUpperCase()).kind, 'product-id');
  assert.equal(resolveOneSegmentRoute('000000000000000000000000').kind, 'product-id');
});

test('every live shop slug resolves to a SHOP, none is mistaken for a product', () => {
  let checked = 0;
  for (const slug of LIVE_SHOP_SLUGS) {
    const route = resolveOneSegmentRoute(slug);
    assert.equal(route.kind, 'shop', `slug ${JSON.stringify(slug)}`);
    assert.equal(route.shopUrl, slug);
    checked += 1;
  }
  assert.equal(checked, LIVE_SHOP_SLUGS.length);
});

test('COLLISION DRILL: the boundary of the rule is exactly 24 hex chars', () => {
  // 23 and 25 hex chars are NOT product ids — they are (odd) shop slugs.
  assert.equal(resolveOneSegmentRoute('68779a71c1e177c08666dd7').kind, 'shop');
  assert.equal(resolveOneSegmentRoute('68779a71c1e177c08666dd7e0').kind, 'shop');
  // 24 chars with one non-hex char is a shop slug, not a product.
  assert.equal(resolveOneSegmentRoute('68779a71c1e177c08666dd7g').kind, 'shop');
  // A slug that merely CONTAINS an ObjectId is a shop.
  assert.equal(resolveOneSegmentRoute('shop-68779a71c1e177c08666dd7e').kind, 'shop');
  // And a genuine 24-hex slug WOULD be read as a product — documented, chosen
  // on purpose (0 of 5,731 live slugs have this shape; a product cannot
  // change its id, a shop can change its slug).
  assert.equal(resolveOneSegmentRoute('abcdefabcdefabcdefabcdef').kind, 'product-id');
});

test('percent-encoded segments decode before the rule runs (space, @, +)', () => {
  assert.deepEqual(resolveOneSegmentRoute('hyped%20dogs-6928aa8205c8819a2dd672c7'), {
    kind: 'shop',
    shopUrl: 'hyped dogs-6928aa8205c8819a2dd672c7',
  });
  assert.deepEqual(resolveOneSegmentRoute('mashcreative%40gmail.com'), {
    kind: 'shop',
    shopUrl: 'mashcreative@gmail.com',
  });
  assert.equal(resolveOneSegmentRoute('aminbbn%2B10%40gmail.com').shopUrl, 'aminbbn+10@gmail.com');
  // Already-decoded input is untouched (decoding is idempotent).
  assert.equal(decodeSegment('roomours'), 'roomours');
  // A malformed escape never throws during render.
  assert.equal(decodeSegment('100%'), '100%');
});

test('FAILING-CASE DRILL: an empty, slash-bearing or control-char segment is invalid, not a shop', () => {
  for (const bad of ['', '   ', 'a%2Fb', 'a/b', 'a\tb', 'tab\tname', undefined, null, 42]) {
    assert.equal(resolveOneSegmentRoute(bad).kind, 'invalid', JSON.stringify(bad));
  }
  // Control: the SAME test on a good slug passes, so the loop above is
  // rejecting for the right reason.
  assert.equal(resolveOneSegmentRoute('roomours').kind, 'shop');
});
