/**
 * Cost-comparator landing copy variants.
 *
 * Public-positioning posture is a pending operator decision per the
 * Day 0-30 plan in the AWIN/Rakuten/Impact displacement strategy.
 *
 *  - `alternative` (DEFAULT) — consultative, legally defensible,
 *    aligns with droplinked's "merchant-direct alternative" framing.
 *  - `killer`      — aggressive, "we are killing the category"
 *    positioning. Reserve for after legal/PR sign-off.
 *
 * To flip the posture WITHOUT a code redeploy, set
 *   NEXT_PUBLIC_COST_COMPARATOR_COPY_VARIANT=killer
 * in the environment (Vercel / ECS task definition / .env.local).
 *
 * To flip it for ALL environments via commit, change `DEFAULT_VARIANT`
 * below and ship a one-line PR. Avoid forking on `process.env.NODE_ENV`
 * — posture is a marketing decision, not an environment concern.
 */

export type CopyVariant = 'alternative' | 'killer';

const DEFAULT_VARIANT: CopyVariant = 'alternative';

/**
 * Reads the effective variant at render time.
 *
 * Server components, client components, and route handlers all share
 * `process.env`, so this helper is safe everywhere. The `NEXT_PUBLIC_`
 * prefix is required for client-side access in Next.js.
 */
export function getCopyVariant(): CopyVariant {
  const raw = process.env.NEXT_PUBLIC_COST_COMPARATOR_COPY_VARIANT;
  if (raw === 'killer' || raw === 'alternative') return raw;
  return DEFAULT_VARIANT;
}

interface HeroCopy {
  headline: string;
  tagline: string;
  ctaPrimary: string;
  ctaSecondary: string;
}

export const HERO_COPY: Record<CopyVariant, HeroCopy> = {
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

interface CtaFooterCopy {
  headline: string;
  subline: string;
  ctaLabel: string;
}

export const CTA_FOOTER_COPY: Record<CopyVariant, CtaFooterCopy> = {
  alternative: {
    headline: 'Start saving today.',
    subline:
      'Talk to a migration specialist. We move your existing publishers, attribution, and payouts in under 30 days.',
    ctaLabel: 'Request a migration plan',
  },
  killer: {
    headline: 'Stop paying the network tax.',
    subline:
      'Migrate your program in days, not quarters. Onchain attribution, USDC payouts, no take-rate.',
    ctaLabel: 'Defect now',
  },
};

interface FeatureComparisonCopy {
  title: string;
  subtitle: string;
}

export const FEATURE_COMPARISON_COPY: Record<CopyVariant, FeatureComparisonCopy> = {
  alternative: {
    title: 'How droplinked compares',
    subtitle:
      'Side-by-side on the dimensions that drive merchant cost and publisher trust.',
  },
  killer: {
    title: 'The networks are obsolete. Here is the proof.',
    subtitle:
      'Side-by-side on every dimension that matters. droplinked wins on five of five.',
  },
};

interface CalculatorCopy {
  title: string;
  subtitle: string;
  submitLabel: string;
  resultHeadline: (savingsAnnual: number) => string;
}

const USD_FMT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export const CALCULATOR_COPY: Record<CopyVariant, CalculatorCopy> = {
  alternative: {
    title: 'See your annual savings',
    subtitle:
      'Estimate what you would save by moving your affiliate program off your current network onto droplinked.',
    submitLabel: 'Calculate savings',
    resultHeadline: (s) =>
      `You would save ${USD_FMT.format(s)} per year with droplinked.`,
  },
  killer: {
    title: 'The receipts',
    subtitle:
      'How much you are bleeding to your current network, every year.',
    submitLabel: 'Show me the receipts',
    resultHeadline: (s) =>
      `You are bleeding ${USD_FMT.format(s)} per year to your current network. Stop.`,
  },
};

/**
 * Convenience: returns every copy block bound to the active variant.
 * Useful for server components that want one read instead of four.
 */
export function loadCopy() {
  const variant = getCopyVariant();
  return {
    variant,
    hero: HERO_COPY[variant],
    calculator: CALCULATOR_COPY[variant],
    featureComparison: FEATURE_COMPARISON_COPY[variant],
    ctaFooter: CTA_FOOTER_COPY[variant],
  };
}
