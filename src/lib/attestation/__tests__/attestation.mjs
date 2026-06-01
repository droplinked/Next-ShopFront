/**
 * Pure JS twin of `@/lib/attestation/attestation`. Mirrors the helpers
 * + status predicates so node --test can exercise them without the
 * TypeScript + Next.js import graph.
 *
 * Keep in sync with attestation.ts — any divergence is a test failure.
 */

export function hasConfirmedAttestation(attestation) {
  if (!attestation) return false;
  return (
    attestation.avax?.status === 'confirmed' ||
    attestation.base?.status === 'confirmed'
  );
}

export function hasAnyAttestationActivity(attestation) {
  if (!attestation) return false;
  return (
    (attestation.avax?.status && attestation.avax.status !== 'absent') ||
    (attestation.base?.status && attestation.base.status !== 'absent')
  );
}

export function confirmedChains(attestation) {
  if (!attestation) return [];
  const out = [];
  if (attestation.avax?.status === 'confirmed') out.push('AVAX');
  if (attestation.base?.status === 'confirmed') out.push('BASE');
  return out;
}

export function truncateHash(value, headChars = 6, tailChars = 4) {
  if (!value || typeof value !== 'string') return '';
  if (value.length <= headChars + tailChars + 1) return value;
  return `${value.slice(0, headChars)}…${value.slice(-tailChars)}`;
}

export function chainLabel(chain) {
  switch (chain) {
    case 'AVAX':
      return 'Avalanche';
    case 'BASE':
      return 'Base';
    default:
      return chain;
  }
}

export function chainIconSrc(chain) {
  switch (chain) {
    case 'AVAX':
      return '/images/chains/avax.svg';
    case 'BASE':
      return '/images/chains/base.svg';
    default:
      return '/images/chains/generic.svg';
  }
}

export function formatAttestedAt(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(date);
  } catch {
    return date.toISOString();
  }
}

export function attestationReasonLabel(reason) {
  switch (reason) {
    case 'INITIAL_PUBLISH':
      return 'Initial publish';
    case 'COMMISSION_RATE_CHANGE':
      return 'Commission rate change';
    case 'FRAUD_RULE_CHANGE':
      return 'Fraud rule change';
    case 'TERMINATION_TERMS_CHANGE':
      return 'Termination terms change';
    case 'MANUAL':
      return 'Manual re-attestation';
    default:
      return 'Attestation';
  }
}
