'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils/cn/cn';
import { useState } from 'react';
import type { IMarketplaceListing } from '@/types/interfaces/marketplace/listing';

/**
 * Hero gallery for the listing detail page. First image is the active
 * hero; subsequent images are thumbnails on the left rail.
 *
 * Falls back to a single placeholder div when imageUrls is empty.
 */
const ListingHero = ({ listing }: { listing: IMarketplaceListing }) => {
  const images = (listing.imageUrls || []).filter(
    (s) => typeof s === 'string' && s.length > 0,
  );
  const [active, setActive] = useState<string | null>(images[0] || null);

  if (!active) {
    return (
      <div
        className="aspect-square w-full bg-secondary/20 rounded-sm flex items-center justify-center text-sm opacity-60"
        data-testid="listing-hero-empty"
      >
        no image available
      </div>
    );
  }

  return (
    <div
      className="flex w-full gap-3 flex-col-reverse sm:flex-row"
      data-testid="listing-hero"
    >
      {images.length > 1 && (
        <div className="flex sm:flex-col gap-2 sm:w-20">
          {images.map((img) => (
            <button
              key={img}
              type="button"
              onClick={() => setActive(img)}
              className={cn(
                'relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-sm overflow-hidden border',
                active === img
                  ? 'border-primary-foreground'
                  : 'border-secondary',
              )}
              data-testid="listing-hero-thumb"
            >
              <Image
                src={img}
                alt={listing.title}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
      <div className="relative aspect-square flex-1 rounded-sm overflow-hidden bg-secondary/10">
        <Image
          src={active}
          alt={listing.title}
          fill
          priority
          sizes="(max-width: 640px) 100vw, 50vw"
          className="object-cover"
        />
      </div>
    </div>
  );
};

export default ListingHero;
