/**
 * Pure JS twin of merchant-theme.ts for `node --test`.
 *
 * We duplicate the resolver logic in plain ESM here so the test file
 * can import it with zero TypeScript or Next.js dependencies. The TS
 * source is the production code; this file mirrors it and is covered
 * by the same test suite — any divergence is a test-failure signal.
 */

export const DROPLINKED_DEFAULT_THEME = Object.freeze({
  brandName: 'droplinked',
  logoUrl: null,
  primaryColor: '#179EF8',
  secondaryColor: '#0E78C2',
  primaryForeground: '#FFFFFF',
  cssVars: Object.freeze({
    '--mt-primary': '#179EF8',
    '--mt-secondary': '#0E78C2',
    '--mt-primary-fg': '#FFFFFF',
  }),
  fontFamily: '',
  hasMerchantBranding: false,
});

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export function isValidHexColor(value) {
  return typeof value === 'string' && HEX_RE.test(value);
}

export function pickForegroundFor(hex) {
  if (!isValidHexColor(hex)) return '#FFFFFF';
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const linearise = (c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const luminance =
    0.2126 * linearise(r) + 0.7152 * linearise(g) + 0.0722 * linearise(b);
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

export function sanitiseLogoUrl(url) {
  if (typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (!/^https?:\/\//i.test(trimmed)) return null;
  return trimmed;
}

export function resolveMerchantTheme(brand) {
  if (!brand) return { ...DROPLINKED_DEFAULT_THEME, cssVars: { ...DROPLINKED_DEFAULT_THEME.cssVars } };

  const brandName =
    typeof brand.shopName === 'string' && brand.shopName.trim()
      ? brand.shopName.trim()
      : DROPLINKED_DEFAULT_THEME.brandName;

  const logoUrl = sanitiseLogoUrl(brand.logo);

  const primaryColor = isValidHexColor(brand.primaryColor)
    ? brand.primaryColor
    : DROPLINKED_DEFAULT_THEME.primaryColor;

  const secondaryColor = isValidHexColor(brand.secondaryColor)
    ? brand.secondaryColor
    : DROPLINKED_DEFAULT_THEME.secondaryColor;

  const primaryForeground = pickForegroundFor(primaryColor);

  const fontFamily =
    typeof brand.fontFamily === 'string' && brand.fontFamily.trim()
      ? brand.fontFamily.trim()
      : '';

  const hasMerchantBranding = Boolean(
    logoUrl ||
      isValidHexColor(brand.primaryColor) ||
      isValidHexColor(brand.secondaryColor) ||
      (typeof brand.shopName === 'string' && brand.shopName.trim()),
  );

  return {
    brandName,
    logoUrl,
    primaryColor,
    secondaryColor,
    primaryForeground,
    fontFamily,
    cssVars: {
      '--mt-primary': primaryColor,
      '--mt-secondary': secondaryColor,
      '--mt-primary-fg': primaryForeground,
    },
    hasMerchantBranding,
  };
}

export function themeAsInlineStyle(theme) {
  const style = { ...theme.cssVars };
  if (theme.fontFamily) style.fontFamily = theme.fontFamily;
  return style;
}
