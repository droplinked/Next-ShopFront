/**
 * Marketplace discovery service — typed wrapper over the
 * /api/marketplace proxy routes.
 *
 * Mirrors the patterns in services/publisher/service.ts:
 *  - graceful degradation (returns empty page / null on transport failure)
 *  - SSR-friendly (accepts an explicit origin so relative URLs resolve)
 *
 * Consumed by:
 *  - src/app/(routes)/marketplace/page.tsx          → listPublic
 *  - src/app/(routes)/marketplace/[slug]/page.tsx   → getBySlug
 */

import type {
  IMarketplaceListing,
  IMarketplaceListingFilter,
  IMarketplaceListingPage,
} from '@/types/interfaces/marketplace/listing';
import {
  encodeFilterToQueryString,
  getRuntimeOrigin,
} from '@/lib/marketplace/marketplace';

/**
 * Public discovery — returns the requested page of listings.
 *
 * Never throws — on any failure returns the empty page envelope so the
 * storefront still renders cleanly. Errors are logged server-side so
 * Sentry / CloudWatch can surface them.
 */
export async function listPublicMarketplaceListings(
  filter: IMarketplaceListingFilter,
  origin?: string,
): Promise<IMarketplaceListingPage> {
  const empty: IMarketplaceListingPage = {
    data: [],
    nextCursor: null,
    limit: 0,
  };
  const baseOrigin = (origin || getRuntimeOrigin()).replace(/\/$/, '');
  const qs = encodeFilterToQueryString(filter);
  try {
    const res = await fetch(`${baseOrigin}/api/marketplace${qs}`, {
      cache: 'no-store',
    });
    if (!res.ok) return empty;
    const json: unknown = await res.json();
    if (!json || typeof json !== 'object') return empty;
    const env = json as Partial<IMarketplaceListingPage>;
    return {
      data: Array.isArray(env.data) ? env.data : [],
      nextCursor: typeof env.nextCursor === 'string' ? env.nextCursor : null,
      limit: typeof env.limit === 'number' ? env.limit : 0,
    };
  } catch {
    return empty;
  }
}

/**
 * Single-listing lookup by slug.
 *
 * Returns null when the upstream 404s (slug unknown / not published) so
 * the [slug] page can render the friendly "not found" state.
 */
export async function getMarketplaceListingBySlug(
  slug: string,
  origin?: string,
): Promise<IMarketplaceListing | null> {
  if (!slug) return null;
  const baseOrigin = (origin || getRuntimeOrigin()).replace(/\/$/, '');
  try {
    const res = await fetch(
      `${baseOrigin}/api/marketplace/${encodeURIComponent(slug)}`,
      { cache: 'no-store' },
    );
    if (!res.ok) return null;
    const json: unknown = await res.json();
    if (!json || typeof json !== 'object') return null;
    // The proxy returns either the listing directly, OR the
    // structured 404 envelope. Detect the latter and return null.
    if (
      (json as { status?: string }).status === 'NOT_FOUND' ||
      (json as { code?: string }).code === 'listing_not_found'
    ) {
      return null;
    }
    return json as IMarketplaceListing;
  } catch {
    return null;
  }
}
