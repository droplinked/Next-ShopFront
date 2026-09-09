/**
 * /<oneSegment> — the storefront's single-segment route. It means one of two
 * things, decided by `@/lib/routing/one-segment-route.mjs`:
 *
 *   /<productId>   24-hex ObjectId → the INTERACTIVE product page (unchanged:
 *                  the same loader, body, loading skeleton and not-found
 *                  behaviour as before this route learned about shops)
 *   /<shopUrl>     anything else  → the SHOP HOME (new): Store JSON-LD,
 *                  the shop's product grid, a real 404 when the shop does
 *                  not exist, an HTTP 5xx (not a 404) when apiv3 cannot answer
 *
 * WHY (measured 2026-09-09): every `/<shop>` — `/roomours`, `/flower`,
 * `/lisa`, including shops with products — fell into the product loader and
 * rendered as a 200 `noindex` not-found shell, while apiv3 advertises
 * `shop.droplinked.com/<shopUrl>` as each shop's canonical Store URL.
 *
 * LOADING BOUNDARY: the segment-level `loading.tsx` that used to wrap this
 * page AND `/<shop>/product/<slug>` is gone. It flushed a 200 shell before
 * either page could decide `notFound()`, so a missing product streamed as
 * HTTP 200 "Product not found" (invisible to any status-code monitor). The
 * skeleton now wraps ONLY the interactive product body via `<Suspense>`
 * below — byte-for-byte the same fallback, same place — so the SEO landing
 * page and the shop home decide their status before anything is sent.
 *
 * The folder is still `[productId]` because Next forbids two different slug
 * names at one dynamic position and the nested `/<shop>/product/<slug>`
 * route shares it (see that page's header).
 */

import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SITE } from "@/lib/site";
import { resolveOneSegmentRoute } from "@/lib/routing/one-segment-route.mjs";
import { throwIfUnavailable } from "@/lib/upstream/fetch-upstream";
import ProductExperience from "./components/ProductExperience";
import ProductLoading from "./components/ProductLoading";
import { getInteractiveProduct } from "./lib/product-data";
import { fetchShopHome, readPage } from "./shop/lib/shop-home-data";
import ShopHome from "./shop/components/ShopHome";

interface PageProps {
  // NOTE: `productId` is the folder/slug name; it carries the raw segment.
  params: Promise<{ productId: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}

// ---- metadata (shop branch only; the product branch keeps inheriting the root) ----

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { productId: segment } = await params;
  const route = resolveOneSegmentRoute(segment);

  if (route.kind === "product-id") return {};
  if (route.kind === "invalid") {
    return { title: `Not found | ${SITE.name}`, robots: { index: false } };
  }

  const page = readPage((await searchParams).page);
  const result = await fetchShopHome(route.shopUrl, page);
  throwIfUnavailable("shop home", result);
  if (result.outcome === "absent") {
    return { title: `Shop not found | ${SITE.name}`, robots: { index: false } };
  }

  const shop = result.body;
  const suffix = shop.page > 1 ? ` — page ${shop.page}` : "";
  const title = `${shop.name}${suffix} | ${SITE.name}`;
  const description =
    shop.description ||
    `Shop ${shop.name}'s products on ${SITE.name}` +
      (shop.total > 0 ? ` — ${shop.total.toLocaleString("en-US")} products.` : ".");

  return {
    title,
    description,
    alternates: { canonical: shop.canonicalUrl },
    openGraph: {
      type: "website",
      url: shop.canonicalUrl,
      title,
      description,
      siteName: shop.name,
      images: shop.logoUrl ? [{ url: shop.logoUrl, alt: `${shop.name} logo` }] : [],
    },
    twitter: {
      card: shop.logoUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: shop.logoUrl ? [shop.logoUrl] : [],
    },
    robots: { index: true, follow: true },
  };
}

// ---- product branch (unchanged behaviour, now behind an in-page Suspense) ----

async function InteractiveProductById({ productId }: { productId: string }) {
  // Fail-open loader: resolves the product across single-shop + aggregate
  // storefronts and never throws. `null` = genuinely unresolvable → a real 404
  // page, never the "Application error" black screen (see lib/product-data.ts).
  const data = await getInteractiveProduct(productId);
  if (!data) notFound();

  // ProductExperience is the ONE shared body — the same interactive slider +
  // Buy-now + description also rendered by the /<merchant>/product/<slug>
  // SEO landing page, so there is a single product experience across both URLs.
  return <ProductExperience product={data} />;
}

// ---- page ----

export default async function OneSegmentPage({ params, searchParams }: PageProps) {
  const { productId: segment } = await params;
  const route = resolveOneSegmentRoute(segment);

  if (route.kind === "product-id") {
    return (
      <Suspense fallback={<ProductLoading />}>
        <InteractiveProductById productId={route.productId} />
      </Suspense>
    );
  }

  if (route.kind === "invalid") notFound();

  const page = readPage((await searchParams).page);
  const result = await fetchShopHome(route.shopUrl, page);
  // absent (no such shop / past the last page) → a REAL 404, decided before
  // any byte is sent; unavailable (apiv3 429 / 5xx / network) → throw →
  // ./error.tsx, HTTP 5xx — never "not found".
  throwIfUnavailable("shop home", result);
  if (result.outcome === "absent") notFound();

  return <ShopHome shop={result.body} />;
}
