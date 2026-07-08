/**
 * /marketplace/<advertiserId>/<itemId>/<slug> — on-domain SSR PDP for a curated
 * EXTERNAL (Impact affiliate) product.
 *
 * WHY THIS ROUTE EXISTS: apiv3 emits a canonical URL, a marketplace sitemap, and
 * agentic `canonicalUrl`s all pointing at `shop.droplinked.com/marketplace/...`,
 * but no storefront route rendered them — so those links resolved to a blank
 * shell (the thin-doorway / affiliate-spam signal). This route server-renders a
 * real, trustworthy product page for each curated item so crawlers, shopping
 * agents, and shoppers all see genuine product content at the canonical URL.
 *
 * HONEST BY DESIGN (not a disguised doorway): droplinked curates + hosts the
 * page; the shopper completes the purchase at the retailer via a disclosed,
 * attributed "Buy at {retailer}" click-out (`rel="sponsored nofollow"`,
 * `target="_blank"`). The page states this plainly.
 *
 * ROUTE PLACEMENT: `marketplace` is a STATIC first segment, so it coexists with
 * the sibling dynamic `[productId]` route (Next.js resolves the static segment
 * first) — no slug-name collision.
 *
 * QUALITY GATE: `fetchMarketplaceItem` returns null for a not-found / gated /
 * 5xx / thin item (same indexability floor as the backend + sitemap), and this
 * page then calls `notFound()` — a real 404, never a shell.
 *
 * Data source (apiv3, @Public, no auth):
 *   GET /v2/marketplace/:advertiserId/:itemId
 * ISR: revalidate every 5 minutes. Fully 5xx-safe (notFound() on null).
 */

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import {
  buildMarketplaceJsonLd,
  fetchMarketplaceItem,
  type MarketplaceView,
} from "./lib/marketplace-data";

// ISR — revalidate every 5 minutes (matches the sibling product page).
export const revalidate = 300;

interface PageProps {
  params: Promise<{ advertiserId: string; itemId: string; slug: string }>;
}

// ---- metadata ----

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { advertiserId, itemId, slug } = await params;
  const view = await fetchMarketplaceItem(advertiserId, itemId, slug);

  if (!view) {
    return { title: "Product not found | droplinked" };
  }

  const soldBy = view.retailerName ? ` — ${view.retailerName}` : "";
  const title = `${view.title}${soldBy} | droplinked`;
  const description = metaDescription(view);
  const ogImage = view.images[0];

  return {
    title,
    description,
    // Self-referencing canonical == the marketplace canonical == sitemap <loc>.
    alternates: { canonical: view.canonicalUrl },
    openGraph: {
      type: "website",
      url: view.canonicalUrl,
      title,
      description,
      siteName: SITE.name,
      images: ogImage ? [{ url: ogImage, alt: view.title }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : [],
    },
    robots: { index: true, follow: true },
  };
}

/** Clean, ~160-char meta description from the sanitized product copy. */
function metaDescription(view: MarketplaceView): string {
  const base =
    view.description ||
    `${view.title}${view.brandName ? ` by ${view.brandName}` : ""}.`;
  const trimmed = base.length > 157 ? `${base.slice(0, 157).trimEnd()}…` : base;
  return trimmed;
}

// ---- page ----

export default async function MarketplaceProductPage({ params }: PageProps) {
  const { advertiserId, itemId, slug } = await params;
  const view = await fetchMarketplaceItem(advertiserId, itemId, slug);

  if (!view) {
    notFound();
  }

  const heroImage = view.images[0];
  const galleryImages = view.images.slice(1, 5);
  const priceLabel = view.price
    ? `${view.price} ${view.priceCurrency}`
    : "Price unavailable";
  const jsonLd = buildMarketplaceJsonLd(view);

  return (
    <>
      {/* Product + Offer JSON-LD — what Googlebot / shopping agents read. */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="container mx-auto px-6 md:px-8 py-8 md:py-12 max-w-6xl">
        {/* ── breadcrumb (internal — not an orphan doorway) ── */}
        <nav
          aria-label="Breadcrumb"
          className="mb-8 text-sm text-foreground/50 flex flex-wrap items-center gap-2"
        >
          <Link href="/" className="hover:text-mint-500 transition-colors">
            droplinked
          </Link>
          <span aria-hidden>/</span>
          <span className="text-foreground/50">Marketplace</span>
          {view.category && (
            <>
              <span aria-hidden>/</span>
              <span className="capitalize text-foreground/50">{view.category}</span>
            </>
          )}
          <span aria-hidden>/</span>
          <span className="text-foreground/70 line-clamp-1">{view.title}</span>
        </nav>

        <div className="flex flex-col md:flex-row items-start gap-10">
          {/* ── media column ── */}
          <div className="w-full md:w-1/2">
            {heroImage ? (
              // Plain <img> (not next/image): product images come from many
              // remote hosts; a plain tag always server-renders and never 500s
              // on an unconfigured image host — what the crawler must see.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={heroImage}
                alt={view.title}
                width={800}
                height={800}
                className="w-full h-auto rounded-lg object-cover bg-surface-1"
                loading="eager"
              />
            ) : (
              <div className="w-full aspect-square rounded-lg bg-surface-1" />
            )}

            {galleryImages.length > 0 && (
              <div className="mt-4 grid grid-cols-4 gap-3">
                {galleryImages.map((img, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={img + i}
                    src={img}
                    alt={`${view.title} — view ${i + 2}`}
                    width={160}
                    height={160}
                    className="w-full h-auto rounded-md object-cover bg-surface-1"
                    loading="lazy"
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── details column ── */}
          <div className="w-full md:w-1/2 flex flex-col gap-5">
            <p className="text-sm uppercase tracking-wide text-foreground/50">
              Sold by {view.retailerName}
            </p>

            <h1 className="text-3xl md:text-4xl font-semibold text-foreground leading-tight">
              {view.title}
            </h1>

            <div className="flex items-center gap-4">
              <span
                className="text-2xl font-bold text-foreground"
                data-testid="marketplace-price"
              >
                {priceLabel}
              </span>
              <span
                className={
                  view.inStock
                    ? "text-sm font-medium text-emerald-600"
                    : "text-sm font-medium text-error-500"
                }
                data-testid="marketplace-availability"
              >
                {view.availabilityLabel}
              </span>
            </div>

            {view.description && (
              <p className="text-base leading-relaxed text-foreground/70 whitespace-pre-line">
                {view.description}
              </p>
            )}

            {/* Primary CTA — attributed, disclosed click-out to the retailer. */}
            {view.buyUrl && (
              <a
                href={view.buyUrl}
                rel="sponsored nofollow"
                target="_blank"
                data-testid="marketplace-buy-cta"
                className="inline-flex items-center justify-center rounded-lg bg-mint-500 hover:bg-mint-400 transition-colors px-6 py-3 text-base font-semibold text-black w-full md:w-auto"
              >
                Buy at {view.retailerName} &rarr;
              </a>
            )}

            {/* Honest disclosure — curated here, purchased at the retailer. */}
            <p className="text-sm text-foreground/50 leading-relaxed">
              droplinked curates this product from{" "}
              <span className="text-foreground/70">{view.retailerName}</span>. You&apos;ll
              complete your purchase securely on {view.retailerName}&apos;s site, and
              it is fulfilled and shipped by {view.retailerName} under their own
              shipping &amp; returns policies. droplinked may earn a commission.
            </p>

            {(view.sku || view.gtin || view.category) && (
              <dl className="text-xs text-foreground/50 flex flex-col gap-1 border-t border-line pt-4">
                {view.category && (
                  <div className="flex gap-2">
                    <dt className="text-foreground/50">Category</dt>
                    <dd className="capitalize text-foreground/70">{view.category}</dd>
                  </div>
                )}
                {view.sku && (
                  <div className="flex gap-2">
                    <dt className="text-foreground/50">SKU</dt>
                    <dd className="text-foreground/70">{view.sku}</dd>
                  </div>
                )}
                {view.gtin && (
                  <div className="flex gap-2">
                    <dt className="text-foreground/50">GTIN</dt>
                    <dd className="text-foreground/70">{view.gtin}</dd>
                  </div>
                )}
              </dl>
            )}

            {/* Trust row + internal links back into the storefront. */}
            <p className="text-xs text-foreground/50 mt-1">
              Curated on{" "}
              <Link href="/" className="text-mint-500 hover:text-mint-400 transition-colors">
                droplinked
              </Link>{" "}
              ·{" "}
              <Link href="/about" className="text-mint-500 hover:text-mint-400 transition-colors">
                About
              </Link>{" "}
              ·{" "}
              <Link href="/contact" className="text-mint-500 hover:text-mint-400 transition-colors">
                Contact
              </Link>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
