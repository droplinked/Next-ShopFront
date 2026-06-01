/**
 * Attestation verifier service — typed wrapper over the
 * /api/attestation/[programId] proxy route.
 *
 * Mirrors the patterns in services/marketplace/service.ts:
 *  - graceful degradation (returns null on transport failure / 404)
 *  - SSR-friendly (accepts an explicit origin so relative URLs resolve)
 *
 * Consumed by:
 *  - src/app/(routes)/attestation/[programId]/page.tsx (standalone verifier)
 *  - src/app/(routes)/marketplace/[slug]/components/AttestationBadge.tsx
 *  - SEO meta + JSON-LD assembly on the verifier landing
 */

import {
  getRuntimeOrigin,
  type IProgramAttestation,
} from '@/lib/attestation/attestation';

/**
 * Returns the full attestation envelope for `programId`, or null when:
 *  - upstream 404s (program not found OR no attestation feature flag)
 *  - upstream returns a non-JSON / malformed body
 *  - the network transport fails
 *
 * Never throws so SSR pages can render an empty state cleanly without
 * a try/catch around every call site.
 */
export async function getProgramAttestation(
  programId: string,
  origin?: string,
): Promise<IProgramAttestation | null> {
  if (!programId) return null;
  const baseOrigin = (origin || getRuntimeOrigin()).replace(/\/$/, '');
  try {
    const res = await fetch(
      `${baseOrigin}/api/attestation/${encodeURIComponent(programId)}`,
      { cache: 'no-store' },
    );
    if (!res.ok) return null;
    const json: unknown = await res.json();
    if (!json || typeof json !== 'object') return null;
    // The proxy returns either the envelope directly OR a structured
    // 404/400 payload. Detect the latter and return null.
    if (
      (json as { status?: string }).status === 'NOT_FOUND' ||
      (json as { status?: string }).status === 'BAD_REQUEST' ||
      (json as { code?: string }).code === 'attestation_not_found' ||
      (json as { code?: string }).code === 'invalid_program_id'
    ) {
      return null;
    }
    return json as IProgramAttestation;
  } catch {
    return null;
  }
}
