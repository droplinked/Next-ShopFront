/**
 * structured-data.ts
 *
 * Fetches and parses the per-product structured-data payload from:
 *   apiv3.droplinked.com/shop/:shopUrl/product/:productSlug/structured-data
 *
 * BE dependency (already live, @Public, no auth):
 *   droplinked-backend
 *     src/modules/seo-discoverability/controllers/seo-discoverability.controller.ts
 *     src/modules/seo-discoverability/services/structured-data.service.ts
 *
 * This is the SSR data source for the per-product landing page that the
 * Google Merchant Center feed links to (`/<merchant>/product/<slug>`).
 * Googlebot / GMC's landing-page check must see a real product here, or
 * the feed is suspended for Misrepresentation (content-less apex shell).
 *
 * OUTCOMES, NOT NULLS (2026-09-09): a 404 is `absent` (→ notFound, a real
 * 404). A 429 / 5xx / network failure is `unavailable` and the page throws —
 * a throttled crawl must never be served (or cached) as "product gone".
 * See `@/lib/upstream/upstream-outcome.mjs`.
 *
 * ★ HOST NORMALISATION: the endpoint returns canonical/url/@id/offers.url
 * on the bare `https://<shopUrl>/...` or `https://droplinked.com/...` host.
 * We rewrite every served URL to the SERVED host `https://shop.droplinked.com`
 * so that the page <link rel=canonical>, the JSON-LD `url`/`@id`/`offers.url`,
 * and the eventual GMC feed-link host are ALL consistent — no mismatch that
 * would re-trigger a Misrepresentation review.
 */

import { fetchUpstreamJson, type UpstreamResult } from "@/lib/upstream/fetch-upstream";

const APIV3_BASE = "https://apiv3.droplinked.com";

/** The host the product page is actually served on (matches the GMC feed link host). */
export const SERVED_HOST = "https://shop.droplinked.com";

// ---- types (shape of the structured-data endpoint response) ----

export interface ProductOfferJsonLd {
  "@type": "Offer";
  url?: string;
  price?: string;
  priceCurrency?: string;
  availability?: string;
  itemCondition?: string;
  [key: string]: unknown;
}

export interface ProductJsonLd {
  "@context": "https://schema.org";
  "@type": "Product";
  "@id"?: string;
  name: string;
  url?: string;
  sku?: string;
  brand?: { "@type": "Brand"; name: string } | unknown;
  offers?: ProductOfferJsonLd;
  description?: string;
  image?: string[];
  dateCreated?: string;
  dateModified?: string;
  [key: string]: unknown;
}

export interface OpenGraphBlock {
  "og:type"?: string;
  "og:title"?: string;
  "og:url"?: string;
  "og:site_name"?: string;
  "og:description"?: string;
  "og:image"?: string;
  "twitter:card"?: string;
  "twitter:title"?: string;
  "twitter:description"?: string;
  "twitter:image"?: string;
  "product:price:amount"?: string;
  "product:price:currency"?: string;
  "product:availability"?: string;
  [key: string]: string | undefined;
}

/**
 * Normalised product type exposed by the BE as a top-level SIBLING of
 * `jsonLd` (droplinked-backend `feat/seo-structured-data-expose-type`).
 * `pod` = print-on-demand (made to order) — the teaser trust row must
 * render Printful's made-to-order terms (see POD_POLICY in site.ts),
 * never the standard return window. The BE OMITS the field when the
 * stored type is absent/unknown; older BE builds don't send it at all —
 * consumers must fail-open to the existing non-POD copy either way.
 */
export type StructuredDataProductType = "pod" | "physical" | "digital";

const KNOWN_PRODUCT_TYPES = new Set<StructuredDataProductType>([
  "pod",
  "physical",
  "digital",
]);

export interface StructuredData {
  productId: string;
  /** Canonical URL — normalised to the served shop.droplinked.com host. */
  canonicalUrl: string;
  /** Absent on older BE builds / unknown types — treat as non-POD. */
  productType?: StructuredDataProductType;
  jsonLd: ProductJsonLd;
  openGraph: OpenGraphBlock;
}

/** A small view model the page renders visible HTML from. */
export interface ProductView {
  name: string;
  description: string;
  /** Display price string, e.g. "50.00". Empty if unavailable. */
  price: string;
  priceCurrency: string;
  /** true = InStock, false = OutOfStock / unknown. */
  inStock: boolean;
  /** Human label, e.g. "In stock" / "Out of stock". */
  availabilityLabel: string;
  images: string[];
  brandName: string;
  sku: string;
  /** The canonical/served product URL on shop.droplinked.com. */
  canonicalUrl: string;
}

// ---- host normalisation ----

/**
 * Rewrites a possibly-bare or droplinked.com-hosted product URL to the
 * served `https://shop.droplinked.com/<merchant>/product/<slug>` form.
 *
 * We do NOT trust the endpoint's host — it has been observed to emit a
 * malformed `https://<shopUrl>/...` (no real host) or `https://droplinked.com/...`.
 * We always reconstruct from the known (merchant, slug) so the served
 * canonical is authoritative and host-consistent.
 */
export function buildServedUrl(merchant: string, slug: string): string {
  return `${SERVED_HOST}/${encodeURIComponent(merchant)}/product/${encodeURIComponent(slug)}`;
}

// ---- runtime validators ----

function isProductJsonLd(v: unknown): v is ProductJsonLd {
  if (!v || typeof v !== "object") return false;
  const p = v as Record<string, unknown>;
  return p["@type"] === "Product" && typeof p.name === "string";
}

function asStringArray(v: unknown): string[] {
  if (typeof v === "string") return [v];
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string");
  return [];
}

function parseStructuredData(
  raw: unknown,
  merchant: string,
  slug: string
): StructuredData | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  if (!isProductJsonLd(r.jsonLd)) return null;

  const servedUrl = buildServedUrl(merchant, slug);

  // Deep-clone + host-normalise the JSON-LD so the served url/@id/offers.url
  // are all on shop.droplinked.com regardless of what the endpoint returned.
  const jsonLd: ProductJsonLd = {
    ...(r.jsonLd as ProductJsonLd),
    "@id": `${servedUrl}#product`,
    url: servedUrl,
  };
  if (jsonLd.offers && typeof jsonLd.offers === "object") {
    jsonLd.offers = { ...jsonLd.offers, url: servedUrl };
  }
  jsonLd.image = asStringArray((r.jsonLd as ProductJsonLd).image);

  const openGraph: OpenGraphBlock =
    r.openGraph && typeof r.openGraph === "object"
      ? { ...(r.openGraph as OpenGraphBlock), "og:url": servedUrl }
      : { "og:url": servedUrl };

  // Fail-open type parse: only the known vocabulary passes through; any
  // other/missing value leaves the field absent (→ existing non-POD copy).
  const productType =
    typeof r.productType === "string" &&
    KNOWN_PRODUCT_TYPES.has(r.productType as StructuredDataProductType)
      ? (r.productType as StructuredDataProductType)
      : undefined;

  return {
    productId: typeof r.productId === "string" ? r.productId : "",
    canonicalUrl: servedUrl,
    ...(productType ? { productType } : {}),
    jsonLd,
    openGraph,
  };
}

/**
 * Maps a normalised StructuredData payload to the page view model.
 */
export function toProductView(data: StructuredData): ProductView {
  const { jsonLd } = data;
  const offer =
    jsonLd.offers && typeof jsonLd.offers === "object"
      ? (jsonLd.offers as ProductOfferJsonLd)
      : undefined;

  const availability = offer?.availability || "";
  const inStock = /InStock/i.test(availability);

  const brand =
    jsonLd.brand && typeof jsonLd.brand === "object"
      ? ((jsonLd.brand as { name?: string }).name ?? "")
      : "";

  return {
    name: jsonLd.name ?? "",
    description: typeof jsonLd.description === "string" ? jsonLd.description : "",
    price: offer?.price ?? "",
    priceCurrency: offer?.priceCurrency ?? "USD",
    inStock,
    availabilityLabel: inStock ? "In stock" : "Out of stock",
    images: asStringArray(jsonLd.image),
    brandName: brand,
    sku: typeof jsonLd.sku === "string" ? jsonLd.sku : "",
    canonicalUrl: data.canonicalUrl,
  };
}

/**
 * Fetches the structured-data payload for a (merchant, productSlug) pair and
 * returns an OUTCOME (see `@/lib/upstream/fetch-upstream`):
 *
 *   ok           the parsed, host-normalised payload
 *   absent       404 — unknown shop or slug: the page calls `notFound()`
 *   unavailable  429 / 5xx / network / unrecognised body: the page THROWS, so
 *                a throttled crawl is an uncached error, never a 404
 *
 * Never throws. Server fetch, no auth (@Public endpoint), cached 5 minutes
 * (Next stores only 200s, so a failure is never remembered).
 */
export async function fetchStructuredData(
  merchant: string,
  productSlug: string
): Promise<UpstreamResult<StructuredData>> {
  const url = `${APIV3_BASE}/shop/${encodeURIComponent(
    merchant
  )}/product/${encodeURIComponent(productSlug)}/structured-data`;

  const result = await fetchUpstreamJson(url, {
    next: { revalidate: 300 },
    headers: {
      Accept: "application/json",
      "User-Agent": "droplinked-shopfront/1.0 (GMC-landing-page)",
    },
  });
  if (result.outcome !== "ok") return result;

  const parsed = parseStructuredData(result.body, merchant, productSlug);
  if (!parsed) {
    // A 200 that is not a Product payload is a contract break upstream, not
    // a missing product — never a cached 404.
    return { outcome: "unavailable", status: result.status, reason: "unrecognised payload" };
  }
  return { outcome: "ok", status: result.status, body: parsed };
}

// Export internal parser for unit-testing without a real HTTP call.
export { parseStructuredData };
