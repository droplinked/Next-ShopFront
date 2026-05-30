/**
 * Proxy for sibling MARWAN G16 BACKEND's per-listing lookup.
 *
 * GET /api/marketplace/[slug]
 *   → forwards to upstream `GET /marketplace/listings/:slug`
 *
 * The backend 404s when:
 *   - the slug doesn't resolve, OR
 *   - the listing is not in a PUBLISHED-like status
 *
 * We forward 404s as `{ status: 'NOT_FOUND' }` so the [slug] page can
 * render a friendly empty state instead of crashing.
 */

import { fetchInstance } from '@/lib/fetchInstance';
import { NextResponse } from 'next/server';

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  if (!slug) {
    return NextResponse.json({ error: 'slug required' }, { status: 400 });
  }

  try {
    const data = await fetchInstance(
      `marketplace/listings/${encodeURIComponent(slug)}`,
      { cache: 'no-cache' },
    );
    // Unwrap TransformInterceptor envelope if present.
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
    // Best-effort parse — the upstream may return a structured envelope.
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
    return NextResponse.json(
      { status: 'NOT_FOUND', code: 'listing_not_found', slug },
      { status: 404 },
    );
  }
}
