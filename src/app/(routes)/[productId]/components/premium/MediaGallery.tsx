'use client';

/**
 * MediaGallery — premium PDP media column.
 *
 * Bloomingdale's pattern: a vertical thumbnail rail beside a large hero.
 * Replaces the legacy ProductSlider (magnifier + 4-up thumbnail grid with a
 * dark "See More" overlay) with a calmer composition:
 *   - hero: large 4:5 image on a near-white ground, click → full lightbox
 *   - rail: up to 6 thumbnails, active one carries a black hairline
 *   - mobile: hero on top, rail becomes a horizontal strip underneath
 *
 * Reuses the already-bundled yet-another-react-lightbox for zoom/gallery.
 */

import { useState } from 'react';
import Image from 'next/image';
import Lightbox from 'yet-another-react-lightbox';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import { IProductMedia } from '@/types/interfaces/product/product';
import { ms } from '@/lib/utils/ms/ms';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';

export default function MediaGallery({
  media,
  alt,
}: {
  media: IProductMedia[];
  alt: string;
}) {
  const items = Array.isArray(media) ? media.filter((m) => m?.url) : [];
  const mainUrl = ms(items) || items[0]?.url || '';
  const [current, setCurrent] = useState(mainUrl);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!items.length) {
    return (
      <div className="aspect-[4/5] w-full rounded-sm bg-neutral-100" aria-hidden />
    );
  }

  return (
    <section className="flex flex-col-reverse gap-3 md:flex-row">
      {/* thumbnail rail */}
      {items.length > 1 && (
        <div className="flex shrink-0 flex-row gap-3 md:flex-col">
          {items.slice(0, 6).map((m, i) => (
            <button
              key={m._id || m.url + i}
              type="button"
              aria-label={`View image ${i + 1}`}
              onClick={() => setCurrent(m.url)}
              className={`relative h-16 w-16 overflow-hidden rounded-sm bg-neutral-50 transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 ${
                current === m.url
                  ? 'ring-1 ring-neutral-900'
                  : 'ring-1 ring-transparent hover:ring-neutral-300'
              }`}
            >
              <Image
                src={m.thumbnail || m.url}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* hero */}
      <button
        type="button"
        aria-label="Open image gallery"
        onClick={() => setLightboxOpen(true)}
        className="relative aspect-[4/5] w-full cursor-zoom-in overflow-hidden rounded-sm bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
      >
        {current && (
          <Image
            src={current}
            alt={alt}
            fill
            priority
            sizes="(min-width: 768px) 44vw, 100vw"
            className="object-cover"
          />
        )}
      </button>

      <Lightbox
        plugins={[Thumbnails]}
        thumbnails={{ position: 'bottom', border: 0, imageFit: 'contain', gap: 0 }}
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={items.map((m) => ({ src: m.url }))}
      />
    </section>
  );
}
