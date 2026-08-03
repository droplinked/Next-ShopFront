/**
 * /marketplace — the marketplace INDEX: the root of the internal link graph
 * for the curated affiliate PDP corpus.
 *
 * BEFORE THIS ROUTE EXISTED, `/marketplace` had no page of its own. It fell
 * through to the sibling dynamic `[productId]` route and rendered as a product
 * named "marketplace": HTTP 200, ~70KB, and zero links to any PDP. So the
 * natural parent of 11,642 product URLs was a soft-404 that consumed crawl
 * budget and passed no importance to anything.
 *
 * `marketplace` is a STATIC segment, so Next resolves this file before the
 * dynamic sibling — adding it both removes that soft-404 and installs the real
 * page in one move.
 *
 * WHAT IT DOES: lists every allowlisted advertiser that has curated, indexable
 * supply, as real `<a href>` links to that advertiser's hub. Crawlers can now
 * walk /marketplace -> /marketplace/:advertiserId -> PDP instead of being
 * handed a flat 11k-URL sitemap with no hierarchy.
 *
 * FAIL-CLOSED: `fetchMarketplaceIndex` returns null when the backend feature
 * flag is off, the allowlist is empty, or the API is unreachable, and this page
 * then calls `notFound()` — a real 404, never an empty grid. An empty index is
 * a soft-404, which is the problem this route was added to remove.
 *
 * Data source (apiv3, @Public, no auth): GET /v2/marketplace
 * ISR: revalidate hourly, matching the endpoint's Cache-Control: max-age=3600.
 */

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { SITE, SITE_URL } from "@/lib/site";
import { fetchMarketplaceIndex } from "./lib/marketplace-index-data";

export const revalidate = 3600;

const CANONICAL = `${SITE_URL}/marketplace`;

const TITLE = "Marketplace — curated products from partner retailers | droplinked";
const DESCRIPTION =
  "Browse products droplinked curates from partner retailers. Each product " +
  "has its own page here; you complete the purchase on the retailer's own site.";

export async function generateMetadata(): Promise<Metadata> {
  const index = await fetchMarketplaceIndex();
  if (!index) {
    return { title: "Marketplace not found | droplinked" };
  }

  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: CANONICAL },
    openGraph: {
      type: "website",
      url: CANONICAL,
      title: TITLE,
      description: DESCRIPTION,
      siteName: SITE.name,
    },
    twitter: { card: "summary", title: TITLE, description: DESCRIPTION },
    robots: { index: true, follow: true },
  };
}

export default async function MarketplaceIndexPage() {
  const index = await fetchMarketplaceIndex();
  if (!index) {
    notFound();
  }

  const totalItems = index.advertisers.reduce((n, a) => n + a.itemCount, 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${CANONICAL}#collection`,
    name: "droplinked Marketplace",
    description: DESCRIPTION,
    url: CANONICAL,
    isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE_URL },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: SITE.name, item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Marketplace", item: CANONICAL },
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="container mx-auto px-6 md:px-8 py-8 md:py-12 max-w-6xl">
        <nav
          aria-label="Breadcrumb"
          className="mb-8 text-sm text-foreground/50 flex flex-wrap items-center gap-2"
        >
          <Link href="/" className="hover:text-mint-500 transition-colors">
            droplinked
          </Link>
          <span aria-hidden>/</span>
          <span className="text-foreground/70">Marketplace</span>
        </nav>

        <header className="mb-10 flex flex-col gap-4 max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-semibold text-foreground leading-tight">
            Marketplace
          </h1>
          <p className="text-base leading-relaxed text-foreground/70">
            droplinked curates products from partner retailers and hosts a page
            for each one. Browse by retailer below — {totalItems.toLocaleString()}{" "}
            products across {index.total}{" "}
            {index.total === 1 ? "retailer" : "retailers"}.
          </p>
          {/* Same honest disclosure the PDP carries, stated up front rather
              than only at the point of click-out. */}
          <p className="text-sm text-foreground/50 leading-relaxed">
            You complete your purchase on the retailer&apos;s own site, and your
            order is fulfilled and shipped by them under their own shipping and
            returns policies. droplinked may earn a commission.
          </p>
        </header>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {index.advertisers.map((advertiser) => (
            <li key={advertiser.advertiserId}>
              <Link
                href={advertiser.href}
                data-testid="marketplace-advertiser-link"
                className="flex flex-col gap-1 rounded-lg border border-line bg-surface-1 px-5 py-4 hover:border-mint-500 transition-colors h-full"
              >
                <span className="text-base font-medium text-foreground">
                  {advertiser.label}
                </span>
                <span className="text-sm text-foreground/50">
                  {advertiser.itemCount.toLocaleString()}{" "}
                  {advertiser.itemCount === 1 ? "product" : "products"}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-10 text-xs text-foreground/50">
          <Link
            href="/"
            className="text-mint-500 hover:text-mint-400 transition-colors"
          >
            droplinked
          </Link>{" "}
          ·{" "}
          <Link
            href="/about"
            className="text-mint-500 hover:text-mint-400 transition-colors"
          >
            About
          </Link>{" "}
          ·{" "}
          <Link
            href="/contact"
            className="text-mint-500 hover:text-mint-400 transition-colors"
          >
            Contact
          </Link>
        </p>
      </main>
    </>
  );
}
