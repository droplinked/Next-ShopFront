/**
 * /marketplace/[slug] — detail page for a single marketplace listing.
 *
 * SSR fetches the listing upfront so:
 *   - the URL is shareable + crawlable with real content
 *   - merchant brand + listing copy appear before any JS runs
 *   - Open Graph image uses the listing hero
 *
 * Backend returns 404 when:
 *   - slug doesn't resolve
 *   - listing is not in a PUBLISHED-like status
 * In both cases the page renders a friendly "not found" state.
 */

import type { Metadata } from 'next';
import { cn } from '@/lib/utils/cn/cn';
import { app_vertical } from '@/lib/variables/variables';
import Link from 'next/link';
import { getMarketplaceListingBySlug } from '@/services/marketplace/service';
import ListingHero from './components/ListingHero';
import ListingDetails from './components/ListingDetails';
import MerchantInfo from './components/MerchantInfo';
import JoinAffiliateProgramCTA from './components/JoinAffiliateProgramCTA';

export const dynamic = 'force-dynamic';

type RouteParams = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getMarketplaceListingBySlug(slug);
  if (!listing) {
    return {
      title: 'Listing not found — droplinked Marketplace',
      description: 'The listing you are looking for is not available.',
    };
  }
  const merchant = listing.merchant?.shopName;
  const title = merchant
    ? `${listing.title} — ${merchant} on droplinked`
    : `${listing.title} — droplinked Marketplace`;
  const description =
    listing.description?.slice(0, 160) ||
    `Join ${merchant || 'the merchant'}'s affiliate program and earn commission on every sale.`;
  const hero = listing.imageUrls?.[0];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: hero ? [{ url: hero }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: hero ? [hero] : undefined,
    },
  };
}

export default async function MarketplaceListingDetailPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { slug } = await params;
  const listing = await getMarketplaceListingBySlug(slug);

  if (!listing) {
    return (
      <main
        className={cn('container mt-20 mb-20', app_vertical, 'gap-6')}
        data-testid="marketplace-listing-not-found"
      >
        <h1 className="text-2xl font-semibold">Listing not found</h1>
        <p className="text-sm opacity-70 max-w-md text-center">
          This listing has been removed or is no longer published. Browse
          the marketplace for other affiliate-ready listings.
        </p>
        <Link
          href="/marketplace"
          className="rounded-sm border border-secondary px-4 py-2 text-sm hover:border-primary-foreground transition-colors"
        >
          Back to marketplace
        </Link>
      </main>
    );
  }

  return (
    <main
      className={cn('container mt-20 mb-20', app_vertical, 'gap-8 w-full')}
      data-testid="marketplace-listing-page"
    >
      <nav
        aria-label="Breadcrumb"
        className="w-full text-xs opacity-70 flex items-center gap-2"
      >
        <Link href="/marketplace" className="hover:underline">
          Marketplace
        </Link>
        <span>/</span>
        <span className="truncate">{listing.title}</span>
      </nav>

      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <ListingHero listing={listing} />
          <ListingDetails listing={listing} />
        </div>
        <aside className="flex flex-col gap-4">
          <JoinAffiliateProgramCTA listing={listing} />
          <MerchantInfo listing={listing} />
        </aside>
      </div>
    </main>
  );
}
