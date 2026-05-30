/**
 * Merchant theme resolver — translates merchant brand tokens into CSS
 * variables that the publisher-invite + post-accept landings consume.
 *
 * The strategy is "graceful fallback". The merchant may have set only a
 * primary colour, only a logo, both, or neither. The resolver always
 * returns a complete IResolvedMerchantTheme so the consumer never has to
 * branch on undefined.
 *
 * Used as a pure function on both the server (during SSR for the landing
 * page) and the client (for the small handful of interactive
 * components). Has zero React or Next.js dependencies on purpose so the
 * .test.mjs file can import it with `node --test`.
 */

import type { IPublisherInvitationMerchantBrand } from '@/types/interfaces/publisher/invitation';

export interface IResolvedMerchantTheme {
  /** Display name (shop name OR "Merchant Affiliate Program" fallback) */
  brandName: string;

  /** Logo URL (merchant logo OR null → consumer renders initials chip) */
  logoUrl: string | null;

  /** Hex primary colour (validated; falls back to droplinked default) */
  primaryColor: string;

  /** Hex secondary colour */
  secondaryColor: string;

  /** Foreground colour computed for legibility on top of primaryColor */
  primaryForeground: string;

  /**
   * CSS variable map ready to apply as inline style on the page root.
   * Example: { '--mt-primary': '#179EF8', '--mt-primary-fg': '#FFFFFF' }
   */
  cssVars: Record<string, string>;

  /** Optional font family — empty string means inherit the root font */
  fontFamily: string;

  /**
   * Whether the resolved theme actually carries any merchant-specific
   * branding. If false, the consumer should render the page with the
   * droplinked default theme + a "Powered by droplinked" header instead
   * of the merchant-branded one.
   */
  hasMerchantBranding: boolean;
}

/** droplinked default brand */
export const DROPLINKED_DEFAULT_THEME: IResolvedMerchantTheme = {
  brandName: 'droplinked',
  logoUrl: null,
  primaryColor: '#179EF8',
  secondaryColor: '#0E78C2',
  primaryForeground: '#FFFFFF',
  cssVars: {
    '--mt-primary': '#179EF8',
    '--mt-secondary': '#0E78C2',
    '--mt-primary-fg': '#FFFFFF',
  },
  fontFamily: '',
  hasMerchantBranding: false,
};

/**
 * 6-char hex validation. We're intentionally strict — anything that
 * doesn't match `#RRGGBB` falls back to the droplinked default, so a
 * mistyped colour can't break the page.
 */
const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export function isValidHexColor(value: unknown): value is string {
  return typeof value === 'string' && HEX_RE.test(value);
}

/**
 * Pick a black-or-white foreground colour for legibility on top of a
 * given background hex. Uses the WCAG relative-luminance approximation
 * (sRGB → linearised → luminance). Threshold 0.5 keeps the test simple
 * while covering the colour-pickers a merchant is likely to use.
 */
export function pickForegroundFor(hex: string): '#000000' | '#FFFFFF' {
  if (!isValidHexColor(hex)) return '#FFFFFF';
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const linearise = (c: number): number =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const luminance = 0.2126 * linearise(r) + 0.7152 * linearise(g) + 0.0722 * linearise(b);
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

/**
 * Sanitises a logo URL. Only http/https accepted — defends against
 * `javascript:` or `data:` URLs that would slip through if the backend
 * is compromised.
 */
export function sanitiseLogoUrl(url: unknown): string | null {
  if (typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (!/^https?:\/\//i.test(trimmed)) return null;
  return trimmed;
}

/**
 * The main resolver. Takes the optional merchant brand from the
 * invitation preview and returns a complete theme.
 */
export function resolveMerchantTheme(
  brand: Partial<IPublisherInvitationMerchantBrand> | null | undefined,
): IResolvedMerchantTheme {
  if (!brand) return { ...DROPLINKED_DEFAULT_THEME };

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

/**
 * Produces inline style object suitable for spreading onto the
 * landing-page root element. React inline styles use camelCase but CSS
 * custom properties stay as-is — we cast to React.CSSProperties via the
 * any-keyed Record cast.
 */
export function themeAsInlineStyle(theme: IResolvedMerchantTheme): Record<string, string> {
  const style: Record<string, string> = { ...theme.cssVars };
  if (theme.fontFamily) style.fontFamily = theme.fontFamily;
  return style;
}
