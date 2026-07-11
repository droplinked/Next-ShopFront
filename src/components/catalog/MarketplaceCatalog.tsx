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
 */

import Link from "next/link";
import type { CatalogProduct } from "@/lib/catalog/marketplace-catalog-data";
import { SITE } from "@/lib/site";

interface MarketplaceCatalogProps {
  products: CatalogProduct[];
  total: number;
}

export default function MarketplaceCatalog({ products }: MarketplaceCatalogProps) {
  return (
    <main className="min-h-[60vh] w-full px-4 py-10 md:px-8 lg:px-12 text-gray-900">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold md:text-3xl">Shop all products</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600 md:text-base">
            Discover physical products from brands and retailers across {SITE.name}.
          </p>
        </header>

        {products.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 py-20 text-center">
            <p className="text-base font-medium text-gray-700">No products to show yet</p>
            <p className="mt-1 text-sm text-gray-500">Please check back soon.</p>
          </div>
        ) : (
          <ul
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
            role="list"
          >
            {products.map((product) => (
              <li key={product.id} className="group">
                <Link
                  href={product.href}
                  className="flex h-full flex-col gap-2 overflow-hidden rounded-lg border border-gray-200 bg-white transition-all duration-200 hover:border-gray-300 hover:shadow-md"
                  aria-label={product.title}
                >
                  <div className="relative aspect-square w-full bg-gray-100">
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full bg-gray-200" aria-hidden="true" />
                    )}
                  </div>
                  <div className="flex flex-col gap-1 px-3 pb-3">
                    <span className="line-clamp-2 text-sm font-medium text-gray-900">
                      {product.title}
                    </span>
                    {product.shopName ? (
                      <span className="line-clamp-1 text-xs text-gray-500">{product.shopName}</span>
                    ) : null}
                    <span className="text-sm font-semibold text-gray-900">
                      $
                      {product.price.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
