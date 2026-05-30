/**
 * /marketplace — public discovery surface for the affiliate marketplace.
 *
 * SSR fetches the requested filter page upfront so:
 *   - the URL is deep-linkable (?q=foo&category=bar...)
 *   - search engines see real content, not a JS spinner
 *   - the initial paint has zero flicker
 *
 * Backend behaviour worth noting:
 *   - When `MARKETPLACE_PUBLIC_DISCOVERY_ENABLED=false` upstream, the
 *     backend returns an EMPTY page (NOT an error). The grid renders
 *     the empty state cleanly.
 *   - Listings without a `slug` (legacy LISTED rows) are filtered out
 *     by the proxy so every detail-page link resolves.
 */

import { Metadata } from 'next';
import { cn } from '@/lib/utils/cn/cn';
import { app_vertical } from '@/lib/variables/variables';
import { decodeFilterFromSearchParams } from '@/lib/marketplace/marketplace';
import { listPublicMarketplaceListings } from '@/services/marketplace/service';
import MarketplaceFilterSidebar from './components/MarketplaceFilterSidebar';
import MarketplaceListingGrid from './components/MarketplaceListingGrid';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Marketplace — droplinked',
  description:
    'Discover affiliate-ready listings from droplinked merchants. Join programs, earn commission, ship verified products.',
  openGraph: {
    title: 'Marketplace — droplinked',
    description:
      'Discover affiliate-ready listings from droplinked merchants.',
    type: 'website',
  },
};

type SearchParamShape = Record<string, string | string[] | undefined>;

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<SearchParamShape>;
}) {
  const params = await searchParams;
  const filter = decodeFilterFromSearchParams(params);
  const page = await listPublicMarketplaceListings(filter);

  return (
    <main
      className={cn('container flex gap-8 mt-20', app_vertical)}
      data-testid="marketplace-page"
    >
      <header className="flex w-full flex-col gap-2">
        <h1 className="text-2xl font-semibold">Marketplace</h1>
        <p className="text-sm opacity-70 max-w-2xl">
          Browse affiliate-ready listings from droplinked merchants. Filter
          by category, price, commission rate, or region. Visit any listing
          to learn about the merchant and join their affiliate program.
        </p>
      </header>

      <div className="flex items-start justify-between md:flex-row flex-col w-full gap-6">
        <div className="w-full md:w-[25%] md:sticky md:top-24">
          <MarketplaceFilterSidebar filter={filter} />
        </div>
        <div className={cn(app_vertical, 'gap-9 w-full md:min-w-[75%]')}>
          <MarketplaceListingGrid
            initialData={page.data}
            initialCursor={page.nextCursor}
            filter={filter}
          />
        </div>
      </div>
    </main>
  );
}
