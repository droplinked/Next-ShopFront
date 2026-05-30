/**
 * Pure JS twin of src/lib/cost-comparator/cost-comparator.ts
 *
 * Mirrors the TypeScript implementation so the test file can import
 * directly from node --test without a TS build step. Keep this file
 * in lockstep with the TS source — drift is the bug we're guarding
 * against by testing both shapes.
 */

export const SUPPORTED_NETWORKS = ['awin', 'rakuten', 'impact'];

export function spendBucket(annualSpendUsd) {
  if (!Number.isFinite(annualSpendUsd) || annualSpendUsd < 0) return 'lt-100k';
  if (annualSpendUsd < 100_000) return 'lt-100k';
  if (annualSpendUsd < 500_000) return '100k-500k';
  if (annualSpendUsd < 1_000_000) return '500k-1m';
  if (annualSpendUsd < 5_000_000) return '1m-5m';
  return '5m-plus';
}

export const NETWORK_PROFILES = [
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

export function formatUsd(value) {
  if (!Number.isFinite(value)) return '$0';
  const abs = Math.abs(value);
  const opts = {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: abs >= 1000 ? 0 : 2,
    minimumFractionDigits: 0,
  };
  return new Intl.NumberFormat('en-US', opts).format(value);
}

export function formatUsdShort(value) {
  if (!Number.isFinite(value)) return '$0';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  if (abs >= 10_000) return `${sign}$${Math.round(abs / 1000)}k`;
  return formatUsd(value);
}

export function formatSpeedMultiplier(multiplier) {
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

export function networkDisplayName(id) {
  const match = NETWORK_PROFILES.find(
    (p) => p.id.toLowerCase() === id.toLowerCase(),
  );
  return match ? match.displayName : id;
}

export function validateCalculatorInput(input) {
  if (!input.currentNetwork) return 'Pick your current network.';
  if (!SUPPORTED_NETWORKS.includes(input.currentNetwork)) {
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLeadCaptureInput(input) {
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

export function buildCalculatorPayload(input) {
  const payload = {
    currentNetwork: input.currentNetwork,
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
