/**
 * Proxy for sibling MARWAN G20 BACKEND's public verifier endpoint.
 *
 * GET /api/attestation/[programId]
 *   → forwards to upstream `GET /affiliate-programs/:programId/attestation`
 *
 * Why a proxy:
 *  1) The browser never sees the backend base URL or the shop API key
 *     (fetchInstance injects both server-side).
 *  2) Auth + base-URL switching between dev / stage / prod is centralised.
 *  3) Backend behaviour is "public artifact" — the endpoint is the same
 *     for authenticated and anonymous callers — so the proxy doesn't
 *     need to thread merchant/customer JWTs through.
 *  4) Backend 404s on unknown programId. We forward the 404 (or a
 *     structured `{ status: 'NOT_FOUND' }` payload) so the verifier
 *     landing can render a friendly empty state instead of crashing.
 *  5) Backend may return a DRAFT-shaped envelope (`status='DRAFT'`,
 *     UIDs null). That's a valid response, not an error — we pass it
 *     straight through and let the verifier render the "no on-chain
 *     attestation yet" state.
 */

import { fetchInstance } from '@/lib/fetchInstance';
import { NextResponse } from 'next/server';

type RouteContext = { params: Promise<{ programId: string }> };

// 24-char hex Mongo ObjectId. Mirrors the backend validation so we
// reject obviously-invalid input at the edge rather than burning a
// round-trip to upstream.
const PROGRAM_ID_PATTERN = /^[a-f0-9]{24}$/i;

export async function GET(_request: Request, context: RouteContext) {
  const { programId } = await context.params;
  if (!programId || !PROGRAM_ID_PATTERN.test(programId)) {
    return NextResponse.json(
      {
        status: 'BAD_REQUEST',
        code: 'invalid_program_id',
        message: 'programId must be a 24-char hex Mongo ObjectId',
      },
      { status: 400 },
    );
  }

  try {
    const data = await fetchInstance(
      `affiliate-programs/${encodeURIComponent(programId)}/attestation`,
      { cache: 'no-cache' },
    );

    // Unwrap TransformInterceptor envelope if present (some backend
    // routes wrap the payload in `{ status, data: ... }`).
    if (
      data &&
      typeof data === 'object' &&
      'data' in data &&
      typeof (data as { data?: unknown }).data === 'object' &&
      (data as { data?: unknown }).data
    ) {
      return NextResponse.json((data as { data: unknown }).data);
    }
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Internal Server Error';

    // Best-effort parse — the backend errors are often JSON envelopes
    // delivered via Error.message. Surface their statusCode upstream so
    // a 404 stays a 404, a 503 stays a 503, etc.
    try {
      const parsed = JSON.parse(message);
      if (parsed && typeof parsed === 'object') {
        const status =
          typeof parsed.statusCode === 'number' ? parsed.statusCode : 404;
        return NextResponse.json(parsed, { status });
      }
    } catch {
      // not JSON — fall through
    }

    // Default: structured 404 so the verifier landing renders the empty
    // state cleanly. Public verifier should never hard-crash a visitor.
    console.error('Attestation verifier proxy error:', message);
    return NextResponse.json(
      {
        status: 'NOT_FOUND',
        code: 'attestation_not_found',
        programId,
      },
      { status: 404 },
    );
  }
}
