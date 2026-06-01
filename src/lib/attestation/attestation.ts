/**
 * Attestation helpers + type contracts for the public verifier surface.
 *
 * Mirrors the response shape produced by sibling MARWAN G20 BACKEND
 * `GET /affiliate-programs/:programId/attestation` (PR #1482 —
 * `ProgramAttestationService.getAttestation`).
 *
 * The endpoint emits per-chain envelopes (`avax` + `base`) with
 * `attestationUid`, `txHash`, `status`, plus `explorerUrl` and `easUrl`
 * pre-rendered server-side. We intentionally model the same nested
 * shape here rather than flatten — keeps the storefront verifier code
 * simple (one Chain-key resolver, both render the same template).
 *
 * Backend chain status semantics:
 *   - `absent`    — no UID and no tx hash on file yet (program in DRAFT,
 *                   or attestation feature flag was OFF when it published)
 *   - `pending`   — tx hash exists but no UID confirmed yet (chain is
 *                   still indexing the receipt)
 *   - `confirmed` — both UID + tx hash present; safe to render explorer
 *                   + EAS-scanner links
 *
 * Keep the field set in sync with PR #1482's `renderChain()` output.
 * Pure helpers (no React) so they can be unit-tested with `node --test`.
 */

/**
 * The two supported EAS chains. Mirrors `AttestationChain` enum from
 * sibling MARWAN multichain-attestation arch (PR #1441).
 */
export type IAttestationChainKey = 'AVAX' | 'BASE';

/**
 * Per-chain confirmation state.
 *  - `absent`    — no record on file (DRAFT program, or feature was off)
 *  - `pending`   — tx submitted, UID still indexing
 *  - `confirmed` — UID + tx both present, fully verifiable
 */
export type IAttestationChainStatus = 'absent' | 'pending' | 'confirmed';

/**
 * A single chain's attestation envelope. Mirrors the backend's
 * `renderChain()` output exactly.
 */
export interface IAttestationChainEnvelope {
  chain: IAttestationChainKey;
  attestationUid: string | null;
  txHash: string | null;
  status: IAttestationChainStatus;
  explorerUrl: string | null;
  easUrl: string | null;
}

/**
 * Material-update reason that triggered a (re-)attestation. Mirrors the
 * `AffiliateProgramAttestationReason` Prisma enum from PR #1482.
 */
export type IAttestationReason =
  | 'INITIAL_PUBLISH'
  | 'COMMISSION_RATE_CHANGE'
  | 'FRAUD_RULE_CHANGE'
  | 'TERMINATION_TERMS_CHANGE'
  | 'MANUAL';

/**
 * Single history entry. Mirrors backend `history[]` element shape.
 */
export interface IAttestationHistoryEntry {
  id: string;
  snapshotHash: string;
  programVersion: number;
  attestedAt: string | Date | null;
  attestedReason: IAttestationReason | null;
  triggerNote: string | null;
  avax: IAttestationChainEnvelope;
  base: IAttestationChainEnvelope;
}

/**
 * Full attestation envelope returned by the public verifier endpoint.
 * Mirrors PR #1482's `getAttestation(programId)` exactly.
 */
export interface IProgramAttestation {
  programId: string;
  programVersion: number;
  status: string;
  attestedAt: string | Date | null;
  attestedSnapshotHash: string | null;
  schemaUid: string | null;
  avax: IAttestationChainEnvelope;
  base: IAttestationChainEnvelope;
  history: IAttestationHistoryEntry[];
}

/**
 * True iff at least one chain has a `confirmed` envelope. Used as the
 * gating predicate for badge rendering — we don't want to flash a
 * "verified" affordance for a program whose attestation hasn't landed.
 */
export function hasConfirmedAttestation(
  attestation: IProgramAttestation | null | undefined,
): boolean {
  if (!attestation) return false;
  return (
    attestation.avax?.status === 'confirmed' ||
    attestation.base?.status === 'confirmed'
  );
}

/**
 * True iff the envelope has any non-absent chain. Used by the verifier
 * landing to decide whether to render the "no attestation yet" empty
 * state vs. show chain detail rows (a `pending` chain still merits a
 * detail row — the tx hash is meaningful even before UID lands).
 */
export function hasAnyAttestationActivity(
  attestation: IProgramAttestation | null | undefined,
): boolean {
  if (!attestation) return false;
  return (
    attestation.avax?.status !== 'absent' ||
    attestation.base?.status !== 'absent'
  );
}

/**
 * Returns the list of chains the badge should advertise (only confirmed
 * ones). Order is stable (AVAX then BASE) so the badge layout doesn't
 * jitter on re-renders / SSR rehydration.
 */
export function confirmedChains(
  attestation: IProgramAttestation | null | undefined,
): IAttestationChainKey[] {
  if (!attestation) return [];
  const out: IAttestationChainKey[] = [];
  if (attestation.avax?.status === 'confirmed') out.push('AVAX');
  if (attestation.base?.status === 'confirmed') out.push('BASE');
  return out;
}

/**
 * Truncates a hex string for compact UI display. Defends against
 * non-string input (the backend types as `string | null` but a bug or
 * version-skew could deliver something weirder).
 *
 * Format: `0x1234…cdef` (configurable head/tail widths).
 */
export function truncateHash(
  value: string | null | undefined,
  headChars = 6,
  tailChars = 4,
): string {
  if (!value || typeof value !== 'string') return '';
  if (value.length <= headChars + tailChars + 1) return value;
  const head = value.slice(0, headChars);
  const tail = value.slice(-tailChars);
  return `${head}…${tail}`;
}

/**
 * Pretty label for a chain key. Used in chip labels + screen-reader
 * text. Kept centralised so a rebrand (e.g. "Avalanche C-Chain") only
 * touches this file.
 */
export function chainLabel(chain: IAttestationChainKey): string {
  switch (chain) {
    case 'AVAX':
      return 'Avalanche';
    case 'BASE':
      return 'Base';
    default:
      return chain;
  }
}

/**
 * Resolves the path to a chain icon under /public. Kept absolute (no
 * .svg duplication into /src) so the icon set is server-cacheable.
 * Falls back to a generic chain placeholder if a chain we don't know
 * about ever shows up in the envelope.
 */
export function chainIconSrc(chain: IAttestationChainKey): string {
  switch (chain) {
    case 'AVAX':
      return '/images/chains/avax.svg';
    case 'BASE':
      return '/images/chains/base.svg';
    default:
      return '/images/chains/generic.svg';
  }
}

/**
 * Format an attestedAt timestamp for display. ISO-string input from the
 * backend, Date object when consumed in-process. Returns the empty
 * string for null/invalid so the consumer can decide whether to render
 * an empty row or omit it.
 */
export function formatAttestedAt(
  value: string | Date | null | undefined,
): string {
  if (!value) return '';
  let date: Date;
  if (value instanceof Date) {
    date = value;
  } else {
    date = new Date(value);
  }
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

/**
 * Human-readable label for an attestation reason. Mirrors the enum from
 * PR #1482's `AffiliateProgramAttestationReason`.
 */
export function attestationReasonLabel(
  reason: IAttestationReason | null | undefined,
): string {
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

/**
 * Best-effort base origin for SSR fetch calls. Mirrors the helper in
 * `@/lib/marketplace/marketplace` so behaviour is identical across the
 * MARWAN-shipped marketplace + verifier surfaces.
 */
export function getRuntimeOrigin(): string {
  const envOrigin =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL;
  if (envOrigin) return envOrigin.replace(/\/$/, '');
  const port = process.env.PORT || '3000';
  return `http://127.0.0.1:${port}`;
}
