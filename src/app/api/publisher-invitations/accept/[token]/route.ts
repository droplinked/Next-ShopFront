/**
 * Proxy for sibling MARWAN G2's publisher-invitation backend.
 *
 * GET  /api/publisher-invitations/accept/[token]   → preview the invitation
 * POST /api/publisher-invitations/accept/[token]   → accept the invitation
 *
 * Both routes forward to the upstream apiv3 contract:
 *   GET  /publisher-invitations/accept/:token
 *   POST /publisher-invitations/accept/:token
 *
 * The proxy exists for three reasons:
 *  1) The browser never sees the backend base URL or the shop API key.
 *  2) Server-side fetchInstance handles auth headers + base URL switching
 *     between dev / stage / prod in one place.
 *  3) Upstream 4xxs (token-not-found, expired, revoked) come through as
 *     structured envelopes rather than the raw upstream HTML.
 *
 * UNTIL the G2 backend ships, the upstream returns 404 and the FE
 * gracefully renders the "invitation not found" landing. No client
 * change is needed when G2 lands — just remove the temporary fallback
 * block.
 */

import { fetchInstance } from '@/lib/fetchInstance';
import { NextResponse } from 'next/server';

type RouteContext = { params: Promise<{ token: string }> };

const STATUS_MAP_4XX_TO_ENVELOPE = {
  404: { status: 'NOT_FOUND' as const, code: 'invitation_not_found' },
  410: { status: 'EXPIRED' as const, code: 'invitation_expired' },
  409: { status: 'ALREADY_ACCEPTED' as const, code: 'invitation_already_accepted' },
  403: { status: 'REVOKED' as const, code: 'invitation_revoked' },
};

function isMappable4xx(
  status: number,
): status is keyof typeof STATUS_MAP_4XX_TO_ENVELOPE {
  return (status as number) in STATUS_MAP_4XX_TO_ENVELOPE;
}

export async function GET(_request: Request, context: RouteContext) {
  const { token } = await context.params;
  if (!token) {
    return NextResponse.json({ error: 'token required' }, { status: 400 });
  }

  try {
    const data = await fetchInstance(
      `publisher-invitations/accept/${encodeURIComponent(token)}`,
      { cache: 'no-cache' },
    );
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    // The fetchInstance wrapper throws on !res.ok with the body text. We try
    // to parse it back as JSON; if the upstream returned a structured 4xx
    // envelope we forward it directly so the FE can show the right copy.
    try {
      const parsed = JSON.parse(message);
      if (parsed && typeof parsed === 'object') {
        return NextResponse.json(parsed, {
          status: typeof parsed.statusCode === 'number' ? parsed.statusCode : 404,
        });
      }
    } catch {
      // not JSON — fall through to a synthesised envelope below
    }

    // Best-effort status detection from the message string. fetchInstance
    // doesn't preserve the upstream status code, so we look for the obvious
    // shapes; defaults to 404 since "token unknown" is the dominant case.
    let inferredStatus = 404;
    if (/410|expired/i.test(message)) inferredStatus = 410;
    else if (/409|already/i.test(message)) inferredStatus = 409;
    else if (/403|revoked/i.test(message)) inferredStatus = 403;
    const envelope = isMappable4xx(inferredStatus)
      ? STATUS_MAP_4XX_TO_ENVELOPE[inferredStatus]
      : { status: 'NOT_FOUND' as const, code: 'invitation_not_found' };
    return NextResponse.json({ ...envelope, token }, { status: inferredStatus });
  }
}

export async function POST(request: Request, context: RouteContext) {
  const { token } = await context.params;
  if (!token) {
    return NextResponse.json({ error: 'token required' }, { status: 400 });
  }

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  try {
    const data = await fetchInstance(
      `publisher-invitations/accept/${encodeURIComponent(token)}`,
      {
        method: 'POST',
        body: JSON.stringify(body ?? {}),
      },
    );
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    try {
      const parsed = JSON.parse(message);
      if (parsed && typeof parsed === 'object') {
        return NextResponse.json(parsed, {
          status: typeof parsed.statusCode === 'number' ? parsed.statusCode : 400,
        });
      }
    } catch {
      // fall through
    }
    return NextResponse.json(
      { error: 'failed to accept invitation', detail: message },
      { status: 502 },
    );
  }
}
