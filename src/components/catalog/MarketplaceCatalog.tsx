/**
 * MarketplaceCatalog — server-rendered aggregate product grid for the platform
 * root (shop.droplinked.com/). Products are pre-fetched in page.tsx (SSR) and
 * passed as props, so there is no client-side data fetch and the full grid is
 * in the initial HTML (crawlable by GMC / Googlebot without JS execution).
 *
 * Each card links to the existing per-shop PDP `/{shopSlug}/product/{slug}`
 * (the same route the GMC feed g:link points at), so clicking a product enters
 * the normal per-shop checkout flow with full shop context.
 *
 * Uses a plain <img> (not next/image) for product thumbnails so arbitrary
 * per-shop CDN hosts don't need next.config remotePatterns entries — matching
 * how the other SSR routes render remote product images.
 *
 * Visual language is deliberately aligned with the premium PDP
 * (PremiumProductExperience / PremiumDetails): Inter type, a calm neutral
 * palette, generous whitespace, quiet borders, and a restrained image-zoom
 * hover — so the root grid reads as the same premium brand as the product page.
 * This is a presentation-only pass: props, data flow, SSR output, and the
 * ROOT_CATALOG_ENABLED gate in page.tsx are all unchanged.
 */

import { inter } from "@/styles/fonts";
import type { CatalogProduct } from "@/lib/catalog/marketplace-catalog-data";
import { SITE } from "@/lib/site";
import CatalogProductCard from "./CatalogProductCard";

interface MarketplaceCatalogProps {
  products: CatalogProduct[];
  total: number;
}

export default function MarketplaceCatalog({ products }: MarketplaceCatalogProps) {
  return (
    <main
      className={`${inter.className} min-h-[60vh] w-full px-6 pb-20 pt-10 text-neutral-900 md:px-8 lg:px-12`}
    >
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 border-b border-neutral-200 pb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            {SITE.name}
          </p>
          <h1 className="mt-3 text-[28px] font-medium leading-9 tracking-tight text-neutral-900 md:text-[34px] md:leading-10">
            Shop all products
          </h1>
          <p className="mt-3 max-w-2xl text-[14px] leading-6 text-neutral-500">
            A curated selection from brands and retailers on {SITE.name} —
            verifiable, made to order, and shipped with tracking.
          </p>
        </header>

        {products.length === 0 ? (
          <div className="rounded-md border border-neutral-200 bg-neutral-50 py-24 text-center">
            <p className="text-[15px] font-medium text-neutral-700">
              No products to show yet
            </p>
            <p className="mt-1 text-[13px] text-neutral-500">
              Please check back soon.
            </p>
          </div>
        ) : (
          <ul
            className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4"
            role="list"
          >
            {products.map((product) => (
              <CatalogProductCard key={product.id} product={product} />
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
