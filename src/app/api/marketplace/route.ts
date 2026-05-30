/**
 * Proxy for sibling MARWAN G16 BACKEND's public marketplace discovery.
 *
 * GET /api/marketplace
 *   → forwards to upstream `GET /marketplace/listings`
 *     with the same querystring.
 *
 * Why a proxy:
 *  1) The browser never sees the backend base URL or the shop API key
 *     (fetchInstance injects both server-side).
 *  2) Auth + base-URL switching between dev / stage / prod is centralised.
 *  3) Listings missing a `slug` (legacy LISTED rows that pre-date
 *     PR #1442) are filtered out — every storefront detail URL must
 *     resolve, and a slug-less listing has no /marketplace/[slug] page.
 *  4) When `MARKETPLACE_PUBLIC_DISCOVERY_ENABLED=false` upstream, the
 *     backend returns an empty page (NOT 503) so the storefront still
 *     renders the empty state cleanly.
 */

import { fetchInstance } from '@/lib/fetchInstance';
import { NextResponse } from 'next/server';

interface UpstreamPage {
  data?: unknown[];
  nextCursor?: string | null;
  limit?: number;
}

function hasSlug(item: unknown): boolean {
  return (
    !!item &&
    typeof item === 'object' &&
    typeof (item as { slug?: unknown }).slug === 'string' &&
    ((item as { slug: string }).slug as string).length > 0
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  try {
    const upstream = await fetchInstance(
      `marketplace/listings?${searchParams.toString()}`,
      { cache: 'no-cache' },
    );

    // Defensively unwrap — TransformInterceptor on the backend may wrap
    // the page envelope in a `{ status, data }` shape on some routes.
    let page: UpstreamPage;
    if (
      upstream &&
      typeof upstream === 'object' &&
      'data' in upstream &&
      typeof (upstream as { data?: unknown }).data === 'object' &&
      (upstream as { data?: { data?: unknown } }).data &&
      'data' in (upstream as { data: { data?: unknown } }).data
    ) {
      page = (upstream as { data: UpstreamPage }).data;
    } else {
      page = upstream as UpstreamPage;
    }

    const items = Array.isArray(page?.data) ? page.data : [];
    const filtered = items.filter(hasSlug);
    return NextResponse.json({
      data: filtered,
      nextCursor: page?.nextCursor ?? null,
      limit: typeof page?.limit === 'number' ? page.limit : filtered.length,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Internal Server Error';
    console.error('Marketplace discovery proxy error:', message);
    // The discovery surface must NEVER hard-fail — render-empty is
    // strictly safer than render-error for a public catalogue page.
    return NextResponse.json(
      { data: [], nextCursor: null, limit: 0, error: message },
      { status: 200 },
    );
  }
}
