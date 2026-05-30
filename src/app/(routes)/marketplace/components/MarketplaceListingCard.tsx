'use client';

import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn/cn';
import {
  formatCommissionRate,
  formatListingPrice,
} from '@/lib/marketplace/marketplace';
import type { IMarketplaceListing } from '@/types/interfaces/marketplace/listing';

/**
 * Single-listing preview tile rendered inside MarketplaceListingGrid.
 *
 * Visible affordances (per G16 acceptance):
 *  - hero image (first of imageUrls), with placeholder for legacy rows
 *  - title (line-clamped to 2)
 *  - price (formatted in listing currency)
 *  - commission rate (percent badge — most-load-bearing piece of
 *    information for the visitor-as-publisher journey)
 *
 * The whole card is wrapped in a Next link to the detail page. Listings
 * without a `slug` are filtered out by the proxy so the link is always
 * resolvable.
 */
const MarketplaceListingCard = ({
  listing,
}: {
  listing: IMarketplaceListing;
}) => {
  const slug = listing.slug || '';
  const hero = listing.imageUrls?.[0];
  const merchantLabel = listing.merchant?.shopName || null;
  const price = formatListingPrice(listing.price, listing.currency);
  const commission = formatCommissionRate(listing.commissionRate);

  return (
    <Link
      href={`/marketplace/${encodeURIComponent(slug)}`}
      className={cn(
        'group flex flex-col gap-3 rounded-sm border border-secondary',
        'overflow-hidden bg-background hover:border-primary-foreground',
        'transition-colors',
      )}
      data-testid="marketplace-listing-card"
    >
      <div className="relative aspect-square w-full bg-secondary/20 overflow-hidden">
        {hero ? (
          <Image
            src={hero}
            alt={listing.title || 'listing image'}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm opacity-60">
            no image
          </div>
        )}
        <div
          className={cn(
            'absolute top-2 right-2 rounded-sm bg-background/90',
            'px-2 py-1 text-xs font-medium border border-secondary',
          )}
          data-testid="marketplace-listing-commission"
        >
          {commission} commission
        </div>
      </div>
      <div className="flex flex-col gap-2 p-3 pt-1">
        {merchantLabel && (
          <div
            className="text-xs uppercase tracking-wide opacity-70"
            data-testid="marketplace-listing-merchant"
          >
            {merchantLabel}
          </div>
        )}
        <div
          className="text-sm font-medium line-clamp-2 min-h-[2.5rem]"
          data-testid="marketplace-listing-title"
        >
          {listing.title || 'Untitled listing'}
        </div>
        <div
          className="text-sm font-semibold"
          data-testid="marketplace-listing-price"
        >
          {price}
        </div>
      </div>
    </Link>
  );
};

export default MarketplaceListingCard;
