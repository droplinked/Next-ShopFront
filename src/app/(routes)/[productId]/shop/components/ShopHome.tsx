/**
 * ShopHome — server-rendered home page for one shop at `/<shopUrl>`.
 *
 * Presentation only: data is resolved in page.tsx via `fetchShopHome` and
 * passed in, so the full grid is in the initial HTML (crawlable without JS).
 * Reuses `CatalogProductCard`, the same tile the platform-root catalog
 * renders, so the two grids cannot drift apart.
 *
 * Every tile links to `/<shopUrl>/product/<slug>` — the shop's canonical
 * product URLs (the GMC feed / sitemap / MCP shape) — so this page is the
 * internal-link parent the whole per-shop corpus was missing.
 */

import Link from "next/link";
import { inter } from "@/styles/fonts";
import { SITE, SITE_URL } from "@/lib/site";
import CatalogProductCard from "@/components/catalog/CatalogProductCard";
import { shopHomePath, type ShopHomeView } from "../lib/shop-home-data";

interface ShopHomeProps {
  shop: ShopHomeView;
}

export default function ShopHome({ shop }: ShopHomeProps) {
  const base = shopHomePath(shop.shopUrl);
  const prevHref = shop.page > 2 ? `${base}?page=${shop.page - 1}` : base;
  const nextHref = `${base}?page=${shop.page + 1}`;
  const hasPrev = shop.page > 1;
  const hasNext = shop.page < shop.totalPages;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: SITE.name, item: SITE_URL },
      { "@type": "ListItem", position: 2, name: shop.name, item: shop.canonicalUrl },
    ],
  };

  const itemListJsonLd =
    shop.products.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `${shop.name} — products`,
          url: shop.canonicalUrl,
          numberOfItems: shop.products.length,
          itemListElement: shop.products.map((p, i) => ({
            "@type": "ListItem",
            position: (shop.page - 1) * shop.pageSize + i + 1,
            name: p.title,
            url: `${SITE_URL}${p.href}`,
          })),
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(shop.storeJsonLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      )}

      <main
        className={`${inter.className} min-h-[60vh] w-full px-6 pb-20 pt-10 text-neutral-900 md:px-8 lg:px-12`}
        data-testid="shop-home"
      >
        <div className="mx-auto max-w-6xl">
          <nav
            aria-label="Breadcrumb"
            className="mb-6 flex flex-wrap items-center gap-2 text-[12px] text-neutral-500"
          >
            <Link href="/" className="transition-colors hover:text-neutral-900">
              {SITE.name}
            </Link>
            <span aria-hidden>/</span>
            <span className="line-clamp-1 text-neutral-700">{shop.name}</span>
          </nav>

          <header className="mb-10 flex items-start gap-5 border-b border-neutral-200 pb-8">
            {shop.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={shop.logoUrl}
                alt={`${shop.name} logo`}
                width={72}
                height={72}
                className="h-[72px] w-[72px] shrink-0 rounded-md bg-neutral-100 object-cover"
                loading="eager"
              />
            ) : null}
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                Shop
              </p>
              <h1 className="mt-2 text-[28px] font-medium leading-9 tracking-tight text-neutral-900 md:text-[34px] md:leading-10">
                {shop.name}
                {shop.page > 1 ? (
                  <span className="text-neutral-400"> — page {shop.page}</span>
                ) : null}
              </h1>
              {shop.description ? (
                <p className="mt-3 max-w-2xl text-[14px] leading-6 text-neutral-500">
                  {shop.description}
                </p>
              ) : null}
              {shop.total > 0 ? (
                <p className="mt-2 text-[12px] text-neutral-400" data-testid="shop-home-total">
                  {shop.total.toLocaleString("en-US")} products
                </p>
              ) : null}
            </div>
          </header>

          {shop.products.length === 0 ? (
            <div className="rounded-md border border-neutral-200 bg-neutral-50 py-24 text-center">
              <p className="text-[15px] font-medium text-neutral-700">
                No products to show yet
              </p>
              <p className="mt-1 text-[13px] text-neutral-500">Please check back soon.</p>
            </div>
          ) : (
            <ul
              className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4"
              role="list"
              data-testid="shop-home-grid"
            >
              {shop.products.map((product) => (
                <CatalogProductCard key={product.id} product={product} />
              ))}
            </ul>
          )}

          {(hasPrev || hasNext) && (
            <nav
              aria-label="Pagination"
              className="mt-12 flex items-center justify-between border-t border-neutral-200 pt-6 text-[13px]"
            >
              {hasPrev ? (
                <Link
                  href={prevHref}
                  rel="prev"
                  className="text-neutral-700 transition-colors hover:text-neutral-900"
                >
                  &larr; Previous
                </Link>
              ) : (
                <span />
              )}
              <span className="text-neutral-400">
                Page {shop.page} of {shop.totalPages}
              </span>
              {hasNext ? (
                <Link
                  href={nextHref}
                  rel="next"
                  className="text-neutral-700 transition-colors hover:text-neutral-900"
                >
                  Next &rarr;
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}

          <p className="mt-12 text-[12px] text-neutral-400">
            Powered by{" "}
            <a
              href={SITE.homepage}
              className="text-neutral-600 transition-colors hover:text-neutral-900"
            >
              {SITE.name}
            </a>{" "}
            — onchain commerce protocol
          </p>
        </div>
      </main>
    </>
  );
}
