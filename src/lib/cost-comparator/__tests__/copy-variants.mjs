/**
 * Pure JS twin of src/lib/cost-comparator/copy-variants.ts.
 *
 * Resolves the active variant from `process.env` so the same env-var
 * flip the runtime honors is exercised by the test runner. Keep this
 * file in lockstep with the TS source.
 */

const DEFAULT_VARIANT = 'alternative';

export function getCopyVariant() {
  const raw = process.env.NEXT_PUBLIC_COST_COMPARATOR_COPY_VARIANT;
  if (raw === 'killer' || raw === 'alternative') return raw;
  return DEFAULT_VARIANT;
}

export const HERO_COPY = {
  alternative: {
    headline:
      'The merchant-direct alternative to AWIN, Impact, and Rakuten',
    tagline:
      'Run your own affiliate program. Pay zero network take-rate. USDC payouts in seconds, not weeks.',
    ctaPrimary: 'Calculate my savings',
    ctaSecondary: 'Talk to our team',
  },
  killer: {
    headline:
      "We're killing the affiliate network as a category.",
    tagline:
      'Run your own program. Pay nothing to networks. Onchain attribution + USDC payouts. AWIN, Impact, and Rakuten are obsolete.',
    ctaPrimary: 'Show me how much I save',
    ctaSecondary: 'Book a defection call',
  },
};
