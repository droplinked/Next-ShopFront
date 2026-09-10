/**
 * /<oneSegment> — the storefront's single-segment route. It means one of two
 * things, decided by `@/lib/routing/one-segment-route.mjs`:
 *
 *   /<productId>   24-hex ObjectId → the INTERACTIVE product page: the same
 *                  loader and body as before this route learned about shops;
 *                  a real 404 when no source knows the product, an HTTP 5xx
 *                  (not a 404) when apiv3 cannot answer
 *   /<shopUrl>     anything else  → the SHOP HOME: Store JSON-LD, the shop's
 *                  product grid, a real 404 when the shop does not exist, an
 *                  HTTP 5xx (not a 404) when apiv3 cannot answer
 *
 * WHY (measured 2026-09-09): every `/<shop>` — `/roomours`, `/flower`,
 * `/lisa`, including shops with products — fell into the product loader and
 * rendered as a 200 `noindex` not-found shell, while apiv3 advertises
 * `shop.droplinked.com/<shopUrl>` as each shop's canonical Store URL.
 *
 * STATUS BEFORE BYTES (measured 2026-09-09): the segment-level `loading.tsx`
 * that used to wrap this page AND `/<shop>/product/<slug>` flushed a 200
 * shell before either page could decide `notFound()`. Its replacement — a
 * `<Suspense>` around the product body — did the same thing one level down:
 * `/000000000000000000000000` (a well-formed id no product has) answered
 * HTTP 200, 59,706 bytes, `<meta name="robots" content="noindex">`, because
 * `notFound()` ran inside the boundary after the shell was sent. So there is
 * no boundary here at all: EVERY branch resolves its data and decides
 * 200 / 404 / 5xx before the first byte, exactly like the shop home and the
 * SEO landing page. The product skeleton that only ever showed while that
 * shell was streaming is gone with it (client navigations wait for the
 * payload, as the other two routes already do).
 *
 * The folder is still `[productId]` because Next forbids two different slug
 * names at one dynamic position and the nested `/<shop>/product/<slug>`
 * route shares it (see that page's header).
 */

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SITE } from "@/lib/site";
import { resolveOneSegmentRoute } from "@/lib/routing/one-segment-route.mjs";
import { throwIfUnavailable } from "@/lib/upstream/fetch-upstream";
import ProductExperience from "./components/ProductExperience";
import { resolveInteractiveProduct } from "./lib/product-data";
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

// ---- page ----

export default async function OneSegmentPage({ params, searchParams }: PageProps) {
  const { productId: segment } = await params;
  const route = resolveOneSegmentRoute(segment);

  if (route.kind === "product-id") {
    // Resolves the product across single-shop + aggregate storefronts and
    // never throws (see lib/product-data.ts). Decided HERE, before any byte:
    //   absent      → a REAL 404 (no source knows the product)
    //   unavailable → throw → ./error.tsx, HTTP 5xx — never "not found"
    const result = await resolveInteractiveProduct(route.productId);
    throwIfUnavailable("product", result);
    if (result.outcome === "absent") notFound();

    // ProductExperience is the ONE shared body — the same interactive slider +
    // Buy-now + description also rendered by the /<merchant>/product/<slug>
    // SEO landing page, so there is a single product experience across both URLs.
    return <ProductExperience product={result.body} />;
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
