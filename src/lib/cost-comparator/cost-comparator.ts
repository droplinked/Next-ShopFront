/**
 * Cost-comparator helpers — pure functions used by the landing page,
 * its API proxy routes, and the unit tests.
 *
 * Kept dependency-free so the same module loads in the Next.js client
 * bundle, the Next.js server runtime, and the `node --test` runner
 * without a build step.
 */

import type { SupportedNetwork } from './types';

export const SUPPORTED_NETWORKS: ReadonlyArray<SupportedNetwork> = [
  'awin',
  'rakuten',
  'impact',
] as const;

/**
 * Anonymized spend buckets for analytics. Never log the raw spend —
 * it correlates 1:1 with merchant identity once paired with the
 * email captured on the lead-capture form, which would defeat the
 * "calculator is anonymous" UX promise.
 */
export type SpendBucket =
  | 'lt-100k'
  | '100k-500k'
  | '500k-1m'
  | '1m-5m'
  | '5m-plus';

export function spendBucket(annualSpendUsd: number): SpendBucket {
  if (!Number.isFinite(annualSpendUsd) || annualSpendUsd < 0) return 'lt-100k';
  if (annualSpendUsd < 100_000) return 'lt-100k';
  if (annualSpendUsd < 500_000) return '100k-500k';
  if (annualSpendUsd < 1_000_000) return '500k-1m';
  if (annualSpendUsd < 5_000_000) return '1m-5m';
  return '5m-plus';
}

/**
 * Strongly-typed display metadata for the three supported networks
 * + droplinked. Mirrors the take-rate / payout-cadence values used
 * server-side so the feature-comparison table stays in sync with
 * the calculator output.
 */
export interface NetworkProfile {
  id: SupportedNetwork | 'droplinked';
  displayName: string;
  takeRatePercent: number; // network's cut of the commission, 0-100
  payoutCadence: string;
  attributionMethod: string;
  menaCoverage: string;
  lendingIntegration: string;
}

export const NETWORK_PROFILES: ReadonlyArray<NetworkProfile> = [
  {
    id: 'droplinked',
    displayName: 'droplinked',
    takeRatePercent: 1,
    payoutCadence: '~2.3 seconds (USDC, onchain)',
    attributionMethod: 'Onchain attestation + cookieless',
    menaCoverage: 'Native (USDC, AED, Telr, Bonum)',
    lendingIntegration: 'Built-in (onchain underwriting)',
  },
  {
    id: 'awin',
    displayName: 'AWIN',
    takeRatePercent: 30,
    payoutCadence: 'NET-30 / NET-60',
    attributionMethod: 'Cookie + pixel',
    menaCoverage: 'Partner-mediated',
    lendingIntegration: 'None',
  },
  {
    id: 'impact',
    displayName: 'Impact.com',
    takeRatePercent: 25,
    payoutCadence: 'NET-30',
    attributionMethod: 'Cookie + S2S postback',
    menaCoverage: 'Limited',
    lendingIntegration: 'None',
  },
  {
    id: 'rakuten',
    displayName: 'Rakuten Advertising',
    takeRatePercent: 30,
    payoutCadence: 'NET-30 to NET-90',
    attributionMethod: 'Cookie + pixel',
    menaCoverage: 'None',
    lendingIntegration: 'None',
  },
];

/**
 * Human-friendly USD formatter. Cents are dropped above $1k for
 * landing-page legibility; sub-$1k values keep two decimals.
 */
export function formatUsd(value: number): string {
  if (!Number.isFinite(value)) return '$0';
  const abs = Math.abs(value);
  const opts: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: abs >= 1000 ? 0 : 2,
    minimumFractionDigits: 0,
  };
  return new Intl.NumberFormat('en-US', opts).format(value);
}

/**
 * Short-form USD ("$290k", "$1.3M"). Use in compact chart labels
 * and the speed-multiplier headline. Falls back to `formatUsd`
 * for values under $10k where the short form would lose precision.
 */
export function formatUsdShort(value: number): string {
  if (!Number.isFinite(value)) return '$0';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  if (abs >= 10_000) return `${sign}$${Math.round(abs / 1000)}k`;
  return formatUsd(value);
}

/**
 * Pretty "1.13M× faster" formatting for the speed-multiplier headline.
 * The backend hands back a raw float like 1127586.21; we render it
 * with one significant digit + magnitude suffix for legibility.
 */
export function formatSpeedMultiplier(multiplier: number): string {
  if (!Number.isFinite(multiplier) || multiplier <= 0) return '0×';
  if (multiplier >= 1_000_000) {
    const m = multiplier / 1_000_000;
    return `${m >= 10 ? Math.round(m) : m.toFixed(2)}M×`;
  }
  if (multiplier >= 1000) {
    const k = multiplier / 1000;
    return `${k >= 10 ? Math.round(k) : k.toFixed(1)}k×`;
  }
  return `${Math.round(multiplier).toLocaleString('en-US')}×`;
}

/**
 * Friendly display name for a network id. Tolerates uppercase / typos
 * from the URL slug case (e.g. `?network=AWIN`) without throwing.
 */
export function networkDisplayName(id: string): string {
  const match = NETWORK_PROFILES.find(
    (p) => p.id.toLowerCase() === id.toLowerCase(),
  );
  return match ? match.displayName : id;
}

/**
 * Light client-side validation. Returns first error or null. The
 * authoritative validation lives on the backend (class-validator);
 * this is purely a UX layer to avoid the round-trip on obvious bugs.
 */
export function validateCalculatorInput(input: {
  currentNetwork?: string;
  annualSpendUsd?: number | string;
  avgCommissionRate?: number | string;
  monthlyTxCount?: number | string;
}): string | null {
  if (!input.currentNetwork) return 'Pick your current network.';
  if (!SUPPORTED_NETWORKS.includes(input.currentNetwork as SupportedNetwork)) {
    return 'Pick a supported network (AWIN, Rakuten, or Impact).';
  }
  const spendNum = Number(input.annualSpendUsd);
  if (!Number.isFinite(spendNum) || spendNum < 0) {
    return 'Enter your annual affiliate spend in USD.';
  }
  if (spendNum > 1_000_000_000) {
    return 'Annual spend must be under $1B.';
  }
  if (input.avgCommissionRate !== undefined && input.avgCommissionRate !== '') {
    const rate = Number(input.avgCommissionRate);
    if (!Number.isFinite(rate) || rate < 0 || rate > 1) {
      return 'Commission rate must be a fraction between 0 and 1 (e.g. 0.10).';
    }
  }
  if (input.monthlyTxCount !== undefined && input.monthlyTxCount !== '') {
    const tx = Number(input.monthlyTxCount);
    if (!Number.isFinite(tx) || tx < 0) {
      return 'Monthly transaction count must be a non-negative number.';
    }
  }
  return null;
}

/**
 * Light validation for the lead-capture form. Same UX-only contract
 * as `validateCalculatorInput` — backend re-validates with class-validator.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLeadCaptureInput(input: {
  merchantEmail?: string;
  merchantName?: string;
}): string | null {
  if (!input.merchantEmail || !EMAIL_RE.test(input.merchantEmail)) {
    return 'Enter a valid email.';
  }
  if (!input.merchantName || input.merchantName.trim().length === 0) {
    return 'Enter your business name.';
  }
  if (input.merchantName.length > 200) {
    return 'Business name must be under 200 characters.';
  }
  return null;
}

/**
 * Coerce calculator-form string inputs into the typed shape the
 * service-layer expects. Strips empty optional fields so they
 * don't get serialized as `null` and trip the class-validator
 * `@IsOptional()` check on the backend.
 */
export function buildCalculatorPayload(input: {
  currentNetwork: string;
  annualSpendUsd: string | number;
  avgCommissionRate?: string | number;
  monthlyTxCount?: string | number;
}) {
  const payload: Record<string, unknown> = {
    currentNetwork: input.currentNetwork as SupportedNetwork,
    annualSpendUsd: Number(input.annualSpendUsd),
  };
  if (input.avgCommissionRate !== undefined && input.avgCommissionRate !== '') {
    payload.avgCommissionRate = Number(input.avgCommissionRate);
  }
  if (input.monthlyTxCount !== undefined && input.monthlyTxCount !== '') {
    payload.monthlyTxCount = Number(input.monthlyTxCount);
  }
  return payload;
}
