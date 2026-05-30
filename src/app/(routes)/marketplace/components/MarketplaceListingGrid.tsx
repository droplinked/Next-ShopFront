'use client';

import { cn } from '@/lib/utils/cn/cn';
import type {
  IMarketplaceListing,
  IMarketplaceListingFilter,
} from '@/types/interfaces/marketplace/listing';
import MarketplaceListingCard from './MarketplaceListingCard';
import { listPublicMarketplaceListings } from '@/services/marketplace/service';
import { useEffect, useRef, useState } from 'react';

interface MarketplaceListingGridProps {
  initialData: IMarketplaceListing[];
  initialCursor: string | null;
  filter: IMarketplaceListingFilter;
}

/**
 * 4-column responsive grid + cursor-based "Load more" pagination.
 *
 * Cursor pagination strategy:
 *  - Initial server render hands us page 1 + the next cursor.
 *  - Clicking "Load more" calls the proxy with `cursor=<last>` and
 *    appends the new page locally.
 *  - When the upstream returns nextCursor=null we hide the button.
 *
 * NOTE: filter changes on the parent trigger a navigation (URL params
 * update) which produces a fresh SSR render — when that happens this
 * component remounts with the new initialData, no useEffect needed for
 * the filter switch itself.
 */
const MarketplaceListingGrid = ({
  initialData,
  initialCursor,
  filter,
}: MarketplaceListingGridProps) => {
  const [items, setItems] = useState<IMarketplaceListing[]>(initialData);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // When the parent re-renders with a different filter, reset local state.
  useEffect(() => {
    setItems(initialData);
    setCursor(initialCursor);
    setError(null);
  }, [initialData, initialCursor]);

  const loadMore = async () => {
    if (!cursor || loading) return;
    setLoading(true);
    setError(null);
    try {
      const page = await listPublicMarketplaceListings({
        ...filter,
        cursor,
      });
      if (!mountedRef.current) return;
      setItems((prev) => [...prev, ...(page.data || [])]);
      setCursor(page.nextCursor || null);
    } catch (e: unknown) {
      if (!mountedRef.current) return;
      setError(e instanceof Error ? e.message : 'failed to load more');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div
        className="flex w-full flex-col items-center justify-center gap-3 py-16 border border-dashed border-secondary rounded-sm"
        data-testid="marketplace-listing-grid-empty"
      >
        <div className="text-base font-medium">No listings yet</div>
        <div className="text-sm opacity-70 text-center max-w-md">
          Try widening the filters, clearing the search box, or checking
          back soon — merchants are publishing new listings every day.
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex w-full flex-col gap-6"
      data-testid="marketplace-listing-grid"
    >
      <div
        className={cn(
          'grid w-full gap-4',
          'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
        )}
      >
        {items.map((listing) => (
          <MarketplaceListingCard
            key={listing.id || listing.slug || listing.droplinkedProductId}
            listing={listing}
          />
        ))}
      </div>
      {cursor && (
        <div className="flex w-full items-center justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className={cn(
              'rounded-sm border border-secondary px-6 py-3 text-sm font-medium',
              'hover:border-primary-foreground transition-colors',
              'disabled:opacity-60 disabled:cursor-not-allowed',
            )}
            data-testid="marketplace-load-more"
          >
            {loading ? 'Loading…' : 'Load more listings'}
          </button>
        </div>
      )}
      {error && (
        <div
          className="text-xs text-center opacity-70"
          data-testid="marketplace-listing-grid-error"
        >
          {error}
        </div>
      )}
    </div>
  );
};

export default MarketplaceListingGrid;
