/**
 * Pins the white-label prefix matcher behaviour so chrome doesn't
 * accidentally show or hide on a regression.
 *
 * Runner: node --test
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { isWhiteLabelRoute, WHITE_LABEL_PREFIXES } from './white-label-prefix.mjs';

test('WHITE_LABEL_PREFIXES contains the expected v1 routes', () => {
  assert.deepEqual(WHITE_LABEL_PREFIXES.sort(), [
    '/publisher',
    '/publisher-invite',
  ]);
});

test('isWhiteLabelRoute: matches /publisher-invite exact', () => {
  assert.equal(isWhiteLabelRoute('/publisher-invite'), true);
});

test('isWhiteLabelRoute: matches /publisher-invite/abc-123', () => {
  assert.equal(isWhiteLabelRoute('/publisher-invite/abc-123'), true);
});

test('isWhiteLabelRoute: matches /publisher/the-flat-lay', () => {
  assert.equal(isWhiteLabelRoute('/publisher/the-flat-lay'), true);
});

test('isWhiteLabelRoute: does NOT match /home or /checkout', () => {
  assert.equal(isWhiteLabelRoute('/home'), false);
  assert.equal(isWhiteLabelRoute('/checkout'), false);
});

test('isWhiteLabelRoute: does NOT match /publisher-anything-else', () => {
  // Prefix matching must be path-segment aware to avoid eating an
  // unrelated route that happens to start with the same letters.
  assert.equal(isWhiteLabelRoute('/publisher-invitee-list'), false);
  assert.equal(isWhiteLabelRoute('/publishers'), false);
});

test('isWhiteLabelRoute: null / undefined / empty is false', () => {
  assert.equal(isWhiteLabelRoute(null), false);
  assert.equal(isWhiteLabelRoute(undefined), false);
  assert.equal(isWhiteLabelRoute(''), false);
});

test('isWhiteLabelRoute: trailing slash matches', () => {
  // Next.js typically strips trailing slashes via routing, but be defensive.
  assert.equal(isWhiteLabelRoute('/publisher-invite/abc/'), true);
});
