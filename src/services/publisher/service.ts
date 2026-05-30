/**
 * Publisher invitation service — wraps the Next.js api proxy routes.
 *
 * Mirrors the patterns in services/shop/service.ts and
 * services/cart/service.ts — every call goes through the
 * /api/publisher-invitations/* proxy so the merchant brand context can
 * be enriched server-side without exposing the backend base URL or
 * shop API key to the browser.
 *
 * The service intentionally returns nullable / partial shapes so the
 * landing page can render a graceful "invitation not found" state
 * without throwing.
 */

import type {
  IPublisherInvitationPreview,
  IPublisherInvitationAcceptResult,
  IPublisherProgramSummary,
} from '@/types/interfaces/publisher/invitation';

/**
 * GET preview of an invitation by token. Returns null when the upstream
 * 4xxs (token unknown / expired / revoked) so consumers can render the
 * friendly "not found" page rather than crashing.
 *
 * Accepts an absolute origin so the call works in SSR (where relative
 * fetches don't resolve to anything).
 */
export async function getPublisherInvitationPreview(
  token: string,
  origin: string,
): Promise<IPublisherInvitationPreview | null> {
  if (!token) return null;
  const safeOrigin = origin.replace(/\/$/, '');
  try {
    const res = await fetch(
      `${safeOrigin}/api/publisher-invitations/accept/${encodeURIComponent(token)}`,
      { cache: 'no-store' },
    );
    if (!res.ok) return null;
    const json: unknown = await res.json();
    if (!json || typeof json !== 'object') return null;
    return json as IPublisherInvitationPreview;
  } catch {
    return null;
  }
}

/**
 * Accept the invitation. Returns null on transport error — consumers
 * surface a generic "couldn't accept" toast.
 */
export async function acceptPublisherInvitation(
  token: string,
): Promise<IPublisherInvitationAcceptResult | null> {
  if (!token) return null;
  try {
    const res = await fetch(
      `/api/publisher-invitations/accept/${encodeURIComponent(token)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      },
    );
    if (!res.ok) return null;
    const json: unknown = await res.json();
    if (!json || typeof json !== 'object') return null;
    return json as IPublisherInvitationAcceptResult;
  } catch {
    return null;
  }
}

/**
 * Lists the programs THIS publisher has joined under THIS merchant.
 * Used by the /[shopSlug]/publisher landing.
 *
 * Until the backend ships the equivalent endpoint, the proxy 200s with
 * an empty array — landing renders "no programs yet" empty state.
 */
export async function listPublisherProgramsForShop(
  shopSlug: string,
  origin: string,
): Promise<IPublisherProgramSummary[]> {
  if (!shopSlug) return [];
  const safeOrigin = origin.replace(/\/$/, '');
  try {
    const res = await fetch(
      `${safeOrigin}/api/publisher/${encodeURIComponent(shopSlug)}/programs`,
      { cache: 'no-store' },
    );
    if (!res.ok) return [];
    const json: unknown = await res.json();
    if (Array.isArray(json)) return json as IPublisherProgramSummary[];
    if (
      json &&
      typeof json === 'object' &&
      Array.isArray((json as { data?: unknown[] }).data)
    ) {
      return (json as { data: IPublisherProgramSummary[] }).data;
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Best-effort base origin for SSR. Mirrors the helper in the
 * affiliate-products page so behaviour is identical.
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
