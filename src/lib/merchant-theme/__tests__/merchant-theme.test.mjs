/**
 * Unit tests for merchant-theme resolver.
 *
 * Runner: node --test (matches src/app/api/mcp/tools/__tests__/ pattern).
 * Invoke directly:
 *   node --test src/lib/merchant-theme/__tests__/merchant-theme.test.mjs
 * Or via npm:
 *   npm test
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  DROPLINKED_DEFAULT_THEME,
  isValidHexColor,
  pickForegroundFor,
  sanitiseLogoUrl,
  resolveMerchantTheme,
  themeAsInlineStyle,
} from '../merchant-theme.mjs';

// ---------- isValidHexColor ----------

test('isValidHexColor: accepts canonical 6-char hex', () => {
  assert.equal(isValidHexColor('#179EF8'), true);
  assert.equal(isValidHexColor('#000000'), true);
  assert.equal(isValidHexColor('#ffffff'), true);
});

test('isValidHexColor: rejects 3-char hex, no-hash, named colours, junk', () => {
  assert.equal(isValidHexColor('#fff'), false);
  assert.equal(isValidHexColor('179EF8'), false);
  assert.equal(isValidHexColor('blue'), false);
  assert.equal(isValidHexColor(undefined), false);
  assert.equal(isValidHexColor(null), false);
  assert.equal(isValidHexColor(123456), false);
  assert.equal(isValidHexColor('#NOTAHEX'), false);
});

// ---------- pickForegroundFor ----------

test('pickForegroundFor: returns black on light backgrounds', () => {
  assert.equal(pickForegroundFor('#FFFFFF'), '#000000');
  assert.equal(pickForegroundFor('#FFFF00'), '#000000');
  assert.equal(pickForegroundFor('#FFD700'), '#000000');
});

test('pickForegroundFor: returns white on dark backgrounds', () => {
  assert.equal(pickForegroundFor('#000000'), '#FFFFFF');
  assert.equal(pickForegroundFor('#179EF8'), '#FFFFFF');
  assert.equal(pickForegroundFor('#3B0764'), '#FFFFFF');
});

test('pickForegroundFor: invalid hex defaults to white', () => {
  assert.equal(pickForegroundFor('not-a-color'), '#FFFFFF');
  assert.equal(pickForegroundFor(''), '#FFFFFF');
});

// ---------- sanitiseLogoUrl ----------

test('sanitiseLogoUrl: passes through http(s) URLs', () => {
  assert.equal(sanitiseLogoUrl('https://cdn.example.com/logo.png'), 'https://cdn.example.com/logo.png');
  assert.equal(sanitiseLogoUrl('http://example.com/logo.png'), 'http://example.com/logo.png');
});

test('sanitiseLogoUrl: rejects javascript:, data:, file: URIs', () => {
  assert.equal(sanitiseLogoUrl('javascript:alert(1)'), null);
  assert.equal(sanitiseLogoUrl('data:image/png;base64,AAAA'), null);
  assert.equal(sanitiseLogoUrl('file:///etc/passwd'), null);
});

test('sanitiseLogoUrl: trims whitespace, returns null for empty/non-string', () => {
  assert.equal(sanitiseLogoUrl('  https://cdn.example.com/logo.png  '), 'https://cdn.example.com/logo.png');
  assert.equal(sanitiseLogoUrl(''), null);
  assert.equal(sanitiseLogoUrl('   '), null);
  assert.equal(sanitiseLogoUrl(undefined), null);
  assert.equal(sanitiseLogoUrl(null), null);
  assert.equal(sanitiseLogoUrl({}), null);
});

// ---------- resolveMerchantTheme ----------

test('resolveMerchantTheme: null brand → droplinked default', () => {
  const t = resolveMerchantTheme(null);
  assert.equal(t.brandName, DROPLINKED_DEFAULT_THEME.brandName);
  assert.equal(t.primaryColor, DROPLINKED_DEFAULT_THEME.primaryColor);
  assert.equal(t.hasMerchantBranding, false);
});

test('resolveMerchantTheme: undefined brand → droplinked default', () => {
  const t = resolveMerchantTheme(undefined);
  assert.equal(t.brandName, DROPLINKED_DEFAULT_THEME.brandName);
});

test('resolveMerchantTheme: full merchant brand applies all fields', () => {
  const t = resolveMerchantTheme({
    shopId: 'shop_1',
    shopSlug: 'theflatlay',
    shopName: 'The Flat Lay',
    logo: 'https://cdn.example.com/flatlay.png',
    primaryColor: '#FF0080',
    secondaryColor: '#00C2FF',
    fontFamily: 'Inter',
  });
  assert.equal(t.brandName, 'The Flat Lay');
  assert.equal(t.logoUrl, 'https://cdn.example.com/flatlay.png');
  assert.equal(t.primaryColor, '#FF0080');
  assert.equal(t.secondaryColor, '#00C2FF');
  assert.equal(t.fontFamily, 'Inter');
  assert.equal(t.hasMerchantBranding, true);
  assert.equal(t.cssVars['--mt-primary'], '#FF0080');
  assert.equal(t.cssVars['--mt-secondary'], '#00C2FF');
});

test('resolveMerchantTheme: invalid hex falls back to default colour', () => {
  const t = resolveMerchantTheme({
    shopId: 'shop_1',
    shopSlug: 'x',
    shopName: 'X',
    primaryColor: 'red',
    secondaryColor: '#oops',
  });
  assert.equal(t.primaryColor, DROPLINKED_DEFAULT_THEME.primaryColor);
  assert.equal(t.secondaryColor, DROPLINKED_DEFAULT_THEME.secondaryColor);
  // Still flags as having branding because shopName is present
  assert.equal(t.hasMerchantBranding, true);
});

test('resolveMerchantTheme: only shopName is enough to flag branding', () => {
  const t = resolveMerchantTheme({
    shopId: 'shop_1',
    shopSlug: 'x',
    shopName: 'X',
  });
  assert.equal(t.hasMerchantBranding, true);
  assert.equal(t.brandName, 'X');
});

test('resolveMerchantTheme: blank shopName falls back to droplinked', () => {
  const t = resolveMerchantTheme({
    shopId: 'shop_1',
    shopSlug: 'x',
    shopName: '   ',
  });
  assert.equal(t.brandName, DROPLINKED_DEFAULT_THEME.brandName);
});

test('resolveMerchantTheme: malicious logo URL is stripped', () => {
  const t = resolveMerchantTheme({
    shopId: 'shop_1',
    shopSlug: 'x',
    shopName: 'X',
    logo: 'javascript:alert(1)',
  });
  assert.equal(t.logoUrl, null);
});

test('resolveMerchantTheme: primaryForeground picked for legibility', () => {
  const dark = resolveMerchantTheme({
    shopId: 's',
    shopSlug: 'x',
    shopName: 'X',
    primaryColor: '#000000',
  });
  assert.equal(dark.primaryForeground, '#FFFFFF');
  const light = resolveMerchantTheme({
    shopId: 's',
    shopSlug: 'x',
    shopName: 'X',
    primaryColor: '#FFFF00',
  });
  assert.equal(light.primaryForeground, '#000000');
});

// ---------- themeAsInlineStyle ----------

test('themeAsInlineStyle: emits CSS vars + fontFamily when present', () => {
  const t = resolveMerchantTheme({
    shopId: 's',
    shopSlug: 'x',
    shopName: 'X',
    primaryColor: '#179EF8',
    fontFamily: 'Inter',
  });
  const style = themeAsInlineStyle(t);
  assert.equal(style['--mt-primary'], '#179EF8');
  assert.equal(style.fontFamily, 'Inter');
});

test('themeAsInlineStyle: omits fontFamily when not provided', () => {
  const t = resolveMerchantTheme({
    shopId: 's',
    shopSlug: 'x',
    shopName: 'X',
  });
  const style = themeAsInlineStyle(t);
  assert.equal('fontFamily' in style, false);
});

test('themeAsInlineStyle: default theme produces 3 CSS vars only', () => {
  const t = resolveMerchantTheme(null);
  const style = themeAsInlineStyle(t);
  assert.deepEqual(Object.keys(style).sort(), [
    '--mt-primary',
    '--mt-primary-fg',
    '--mt-secondary',
  ]);
});
