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
 * If the endpoint returns 404 / 5xx / an unrecognised payload, the fetch
 * returns null and the page falls through to notFound() — fully 5xx-safe,
 * mirroring src/app/m/[slug]/lib/discovery-profile.ts.
 *
 * ★ HOST NORMALISATION: the endpoint returns canonical/url/@id/offers.url
 * on the bare `https://<shopUrl>/...` or `https://droplinked.com/...` host.
 * We rewrite every served URL to the SERVED host `https://shop.droplinked.com`
 * so that the page <link rel=canonical>, the JSON-LD `url`/`@id`/`offers.url`,
 * and the eventual GMC feed-link host are ALL consistent — no mismatch that
 * would re-trigger a Misrepresentation review.
 */

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

export interface StructuredData {
  productId: string;
  /** Canonical URL — normalised to the served shop.droplinked.com host. */
  canonicalUrl: string;
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

  return {
    productId: typeof r.productId === "string" ? r.productId : "",
    canonicalUrl: servedUrl,
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
 * Fetches the structured-data payload for a (merchant, productSlug) pair.
 * Returns null on network error, 404, 5xx, or an unrecognised payload.
 * Never throws — callers should fall through to notFound() on null.
 *
 * Server fetch, no auth (@Public endpoint), ISR-cached for 5 minutes.
 */
export async function fetchStructuredData(
  merchant: string,
  productSlug: string
): Promise<StructuredData | null> {
  const url = `${APIV3_BASE}/shop/${encodeURIComponent(
    merchant
  )}/product/${encodeURIComponent(productSlug)}/structured-data`;

  let response: Response;
  try {
    response = await fetch(url, {
      next: { revalidate: 300 },
      headers: {
        Accept: "application/json",
        "User-Agent": "droplinked-shopfront/1.0 (GMC-landing-page)",
      },
    });
  } catch {
    // Network error (DNS, timeout, etc.) — treat as not-found, never throw.
    return null;
  }

  if (!response.ok) {
    // 404 = unknown shop/slug; 5xx = backend down — notFound() either way.
    return null;
  }

  let raw: unknown;
  try {
    raw = await response.json();
  } catch {
    return null;
  }

  return parseStructuredData(raw, merchant, productSlug);
}

// Export internal parser for unit-testing without a real HTTP call.
export { parseStructuredData };
