/**
 * /marketplace/<advertiserId> — the per-retailer HUB.
 *
 * This route did not exist: it returned a hard 404 while the sitemap listed
 * 11,642 PDPs underneath it. The hub is the middle tier of the link graph —
 * /marketplace -> here -> PDP — and it is what actually gives each PDP an
 * inbound internal link, which is Google's primary page-importance signal and
 * the thing whose absence produced "Discovered - currently not indexed /
 * lastCrawl NEVER" across 99.3% of the corpus.
 *
 * ROUTE ARITY: this sits above the existing `[itemId]/[slug]/page.tsx`, so a
 * one-segment request lands here and a three-segment request lands on the PDP.
 * No collision.
 *
 * SITEMAP AGREEMENT: the backend serves this hub through the SAME supply
 * enumeration and the SAME `marketplacePdpIsIndexable` gate the sitemap uses.
 * That is the invariant that matters — if the hub linked to an item the
 * sitemap excluded, we would be emitting internal links to pages we
 * simultaneously tell Google not to index, which is worse than no hub at all.
 *
 * FAIL-CLOSED: disabled flag, non-allowlisted advertiser, no indexable supply,
 * and an out-of-range page all produce the same null -> `notFound()`. They are
 * indistinguishable on purpose, so this cannot be used to read the allowlist,
 * and an out-of-range ?page=N is a real 404 rather than an empty 200 that
 * would let a crawler wander into unbounded pagination space.
 *
 * Data source (apiv3, @Public, no auth): GET /v2/marketplace/:advertiserId
 * ISR: revalidate hourly, matching the endpoint's Cache-Control: max-age=3600.
 */

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { SITE, SITE_URL } from "@/lib/site";
import {
  advertiserHubPath,
  fetchAdvertiserHub,
  type MarketplaceHubView,
} from "../lib/marketplace-index-data";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ advertiserId: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}

/** `?page=` -> a positive integer. Anything unparseable is page 1. */
function readPage(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const n = Number(value);
  return Number.isFinite(n) && n >= 1 ? Math.trunc(n) : 1;
}

/**
 * Self-referencing canonical. Page 2+ canonicalises to ITSELF, not back to
 * page 1: pointing every paginated page at page 1 tells Google the deeper
 * pages are duplicates, which would de-index exactly the pages carrying the
 * links to items 49+.
 */
function hubCanonical(advertiserId: string, page: number): string {
  const base = `${SITE_URL}${advertiserHubPath(advertiserId)}`;
  return page > 1 ? `${base}?page=${page}` : base;
}

function hubTitle(hub: MarketplaceHubView): string {
  const suffix = hub.page > 1 ? ` — page ${hub.page}` : "";
  return `${hub.label} — ${hub.total.toLocaleString()} products${suffix} | droplinked`;
}

function hubDescription(hub: MarketplaceHubView): string {
  return (
    `Browse ${hub.total.toLocaleString()} products droplinked curates from ` +
    `${hub.label}. You complete your purchase on the retailer's own site.`
  );
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const { advertiserId } = await params;
  const page = readPage((await searchParams).page);
  const hub = await fetchAdvertiserHub(advertiserId, page);

  if (!hub) {
    return { title: "Retailer not found | droplinked" };
  }

  const title = hubTitle(hub);
  const description = hubDescription(hub);

  return {
    title,
    description,
    alternates: { canonical: hubCanonical(advertiserId, hub.page) },
    openGraph: {
      type: "website",
      url: hubCanonical(advertiserId, hub.page),
      title,
      description,
      siteName: SITE.name,
    },
    twitter: { card: "summary", title, description },
    robots: { index: true, follow: true },
  };
}

export default async function MarketplaceAdvertiserHubPage({
  params,
  searchParams,
}: PageProps) {
  const { advertiserId } = await params;
  const page = readPage((await searchParams).page);
  const hub = await fetchAdvertiserHub(advertiserId, page);

  if (!hub) {
    notFound();
  }

  const canonical = hubCanonical(advertiserId, hub.page);
  const hubBase = advertiserHubPath(advertiserId);
  const offset = (hub.page - 1) * hub.pageSize;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${canonical}#collection`,
    name: hub.label,
    description: hubDescription(hub),
    url: canonical,
    isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE_URL },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: SITE.name, item: SITE_URL },
        {
          "@type": "ListItem",
          position: 2,
          name: "Marketplace",
          item: `${SITE_URL}/marketplace`,
        },
        { "@type": "ListItem", position: 3, name: hub.label, item: canonical },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: hub.total,
      itemListElement: hub.items.map((item, i) => ({
        "@type": "ListItem",
        position: offset + i + 1,
        name: item.title,
        url: `${SITE_URL}${item.href}`,
      })),
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
          <Link href="/marketplace" className="hover:text-mint-500 transition-colors">
            Marketplace
          </Link>
          <span aria-hidden>/</span>
          <span className="text-foreground/70 line-clamp-1">{hub.label}</span>
        </nav>

        <header className="mb-10 flex flex-col gap-4 max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-semibold text-foreground leading-tight">
            {hub.label}
          </h1>
          <p className="text-base leading-relaxed text-foreground/70">
            {hub.total.toLocaleString()}{" "}
            {hub.total === 1 ? "product" : "products"} curated by droplinked
            {hub.totalPages > 1 ? ` — page ${hub.page} of ${hub.totalPages}` : ""}.
          </p>
          <p className="text-sm text-foreground/50 leading-relaxed">
            You complete your purchase on the retailer&apos;s own site, and your
            order is fulfilled and shipped by them under their own shipping and
            returns policies. droplinked may earn a commission.
          </p>
        </header>

        <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {hub.items.map((item) => (
            <li key={item.itemId}>
              <Link
                href={item.href}
                data-testid="marketplace-hub-item-link"
                className="flex flex-col gap-2 group"
              >
                {item.image ? (
                  // Plain <img> (not next/image): product images come from many
                  // remote hosts; a plain tag always server-renders and never
                  // 500s on an unconfigured image host — what the crawler must
                  // see. Same reasoning as the PDP.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.image}
                    alt={item.title}
                    width={400}
                    height={400}
                    className="w-full h-auto aspect-square rounded-lg object-cover bg-surface-1"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full aspect-square rounded-lg bg-surface-1" />
                )}
                <span className="text-sm text-foreground/70 group-hover:text-mint-500 transition-colors line-clamp-2">
                  {item.title}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {/* Real prev/next anchors, not JS pagination — a crawler has to be able
            to reach items 49+ by following a link. */}
        {hub.totalPages > 1 && (
          <nav
            aria-label="Pagination"
            className="mt-10 flex items-center justify-between gap-4 border-t border-line pt-6 text-sm"
          >
            {hub.page > 1 ? (
              <Link
                href={hub.page === 2 ? hubBase : `${hubBase}?page=${hub.page - 1}`}
                rel="prev"
                className="text-mint-500 hover:text-mint-400 transition-colors"
              >
                &larr; Previous
              </Link>
            ) : (
              <span />
            )}
            <span className="text-foreground/50">
              Page {hub.page} of {hub.totalPages}
            </span>
            {hub.page < hub.totalPages ? (
              <Link
                href={`${hubBase}?page=${hub.page + 1}`}
                rel="next"
                className="text-mint-500 hover:text-mint-400 transition-colors"
              >
                Next &rarr;
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}

        <p className="mt-10 text-xs text-foreground/50">
          <Link
            href="/marketplace"
            className="text-mint-500 hover:text-mint-400 transition-colors"
          >
            All retailers
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
