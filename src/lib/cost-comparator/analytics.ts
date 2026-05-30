/**
 * Cost-comparator analytics — thin abstraction over whatever
 * tracker the host app eventually wires in (Google Analytics,
 * PostHog, Segment, etc.).
 *
 * Today the host repo does not have a global analytics provider;
 * we forward events to `window.dataLayer` (GTM-compatible) and
 * `window.posthog` if present, and fall back to a console.debug
 * trace in development.
 *
 * Spend is always reported as the anonymized bucket — never the
 * raw amount — to keep the calculator surface genuinely anonymous
 * (see comment in `cost-comparator.ts`).
 */

import { spendBucket, type SpendBucket } from './cost-comparator';
import type { SupportedNetwork } from './types';

interface DataLayerLike {
  push: (event: Record<string, unknown>) => void;
}

interface PosthogLike {
  capture: (event: string, props?: Record<string, unknown>) => void;
}

interface AnalyticsWindow extends Window {
  dataLayer?: DataLayerLike;
  posthog?: PosthogLike;
}

function emit(eventName: string, props: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  const w = window as AnalyticsWindow;
  try {
    w.dataLayer?.push({ event: eventName, ...props });
  } catch (err) {
    // dataLayer push must never break the UI
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[analytics] dataLayer push failed for ${eventName}`, err);
    }
  }
  try {
    w.posthog?.capture(eventName, props);
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[analytics] posthog capture failed for ${eventName}`, err);
    }
  }
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[analytics] ${eventName}`, props);
  }
}

export function trackCalculatorSubmit(input: {
  currentNetwork: SupportedNetwork;
  annualSpendUsd: number;
}): void {
  emit('cost_comparator_calculator_submit', {
    network: input.currentNetwork,
    spend_bucket: spendBucket(input.annualSpendUsd),
    surface: 'affiliate-vs-networks',
  });
}

export function trackCalculatorResult(result: {
  currentNetwork: SupportedNetwork;
  savingsAnnualUsd: number;
  annualSpendUsd: number;
}): void {
  emit('cost_comparator_calculator_result', {
    network: result.currentNetwork,
    spend_bucket: spendBucket(result.annualSpendUsd),
    savings_bucket: savingsBucket(result.savingsAnnualUsd),
    surface: 'affiliate-vs-networks',
  });
}

export function trackLeadCaptureSubmit(input: {
  currentNetwork: SupportedNetwork;
  annualSpendUsd: number;
  verticalHint?: string;
  utmSource?: string;
}): void {
  emit('cost_comparator_lead_capture_submit', {
    network: input.currentNetwork,
    spend_bucket: spendBucket(input.annualSpendUsd),
    vertical_hint: input.verticalHint ?? null,
    utm_source: input.utmSource ?? null,
    surface: 'affiliate-vs-networks',
  });
}

export function trackLeadCaptureConversion(result: {
  currentNetwork: SupportedNetwork;
  savingsAnnualUsd: number;
  annualSpendUsd: number;
}): void {
  emit('cost_comparator_lead_capture_conversion', {
    network: result.currentNetwork,
    spend_bucket: spendBucket(result.annualSpendUsd),
    savings_bucket: savingsBucket(result.savingsAnnualUsd),
    surface: 'affiliate-vs-networks',
  });
}

type SavingsBucket =
  | 'lt-25k'
  | '25k-100k'
  | '100k-500k'
  | '500k-1m'
  | '1m-plus';

function savingsBucket(savings: number): SavingsBucket {
  if (!Number.isFinite(savings) || savings < 25_000) return 'lt-25k';
  if (savings < 100_000) return '25k-100k';
  if (savings < 500_000) return '100k-500k';
  if (savings < 1_000_000) return '500k-1m';
  return '1m-plus';
}

// Re-export bucket types so consumers can write strongly-typed handlers.
export type { SpendBucket };
