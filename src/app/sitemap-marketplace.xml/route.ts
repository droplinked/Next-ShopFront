/**
 * Sitemap entries for active marketplace listings.
 *
 * Served at `/sitemap-marketplace.xml`. This is a SEPARATE sitemap
 * (vs adding to the root sitemap) for two reasons:
 *   1) The root sitemap does not exist in this repo yet — adding one
 *      now would conflict with sibling shopfront-template work.
 *   2) A separate file lets us cache it independently and add it to
 *      `robots.txt` as a referenced sub-sitemap whenever the root
 *      sitemap is introduced.
 *
 * The route pages through the discovery proxy, accumulating up to
 * MAX_ENTRIES listings. We deliberately cap the page size to avoid
 * runaway crawls during the early launch — bump when traffic warrants.
 */

import { listPublicMarketplaceListings } from '@/services/marketplace/service';
import { getRuntimeOrigin } from '@/lib/marketplace/marketplace';
import { MARKETPLACE_MAX_LIMIT } from '@/types/interfaces/marketplace/listing';

// Soft cap so a runaway crawl doesn't blow the response budget.
// 50 pages * 100 = 5000 URLs, well under the 50k sitemap soft-limit.
const MAX_PAGES = 50;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const origin = getRuntimeOrigin();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || origin;
  const urls: { loc: string; lastmod?: string }[] = [];

  let cursor: string | null = null;
  for (let i = 0; i < MAX_PAGES; i++) {
    const page = await listPublicMarketplaceListings(
      { cursor: cursor || undefined, limit: MARKETPLACE_MAX_LIMIT },
      origin,
    );
    for (const listing of page.data || []) {
      if (!listing.slug) continue;
      urls.push({
        loc: `${baseUrl.replace(/\/$/, '')}/marketplace/${encodeURIComponent(listing.slug)}`,
        lastmod: listing.updatedAt || listing.publishedAt || undefined,
      });
    }
    if (!page.nextCursor) break;
    cursor = page.nextCursor;
  }

  // Always emit the index URL too.
  urls.unshift({ loc: `${baseUrl.replace(/\/$/, '')}/marketplace` });

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${escapeXml(u.loc)}</loc>${
      u.lastmod ? `\n    <lastmod>${escapeXml(u.lastmod)}</lastmod>` : ''
    }
  </url>`,
  )
  .join('\n')}
</urlset>`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
