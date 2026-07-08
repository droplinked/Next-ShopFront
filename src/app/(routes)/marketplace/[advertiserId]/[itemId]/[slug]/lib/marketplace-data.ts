/**
 * marketplace-data.ts
 *
 * SSR data source for the on-domain affiliate/marketplace PDP served at
 *   shop.droplinked.com/marketplace/<advertiserId>/<itemId>/<slug>
 *
 * Fetches the curated read-model from apiv3 (already live, @Public, no auth):
 *   GET {APIV3}/v2/marketplace/:advertiserId/:itemId  →  MarketplacePdpDto
 *
 * BE dependency (droplinked-backend):
 *   src/modules/marketplace-pdp/controllers/marketplace-pdp.controller.ts
 *   src/modules/marketplace-pdp/services/marketplace-pdp.service.ts
 *
 * These are EXTERNAL Impact-catalogue products: droplinked curates + hosts the
 * indexable product page, and the shopper completes the purchase at the retailer
 * (the attributed `/r` click-out). The page is honest about that — it is NOT a
 * disguised doorway.
 *
 * QUALITY GATE (anti-spam): the endpoint may return a thin row. We render ONLY
 * items that clear the SAME indexability floor the backend / sitemap use
 * (`marketplacePdpIsIndexable`): non-empty title, ≥1 image, a real positive
 * price, and a description that is more than boilerplate. Anything below the
 * floor → null → the page calls `notFound()` (a real 404, never a shell), so a
 * crawler never indexes a thin marketplace page.
 *
 * If the endpoint 404s / 5xx / returns an unrecognised payload, the fetch
 * returns null and the page falls through to `notFound()` — fully 5xx-safe,
 * mirroring the sibling product page's structured-data loader.
 */

import { SITE, SITE_URL } from "@/lib/site";

/** apiv3 base — overridable for dev/preview; defaults to the prod API host. */
const APIV3_BASE = (
  process.env.APIV3_BASE_URL || "https://apiv3.droplinked.com"
).replace(/\/+$/, "");

/** Mirrors the backend indexability floor (marketplace-indexable.util.ts). */
const MIN_DESCRIPTION_LENGTH = 50;
const MIN_DESCRIPTION_WORDS = 8;

// ---- shape of the apiv3 MarketplacePdpDto ----

export type MarketplaceAvailability = "InStock" | "OutOfStock";

export interface MarketplacePdpDto {
  advertiserId: string;
  itemId: string;
  title: string;
  description: string;
  images: string[];
  priceMinor: number | null;
  currency: string;
  availability: MarketplaceAvailability;
  brand: string;
  retailerName: string;
  category: string;
  sku?: string;
  gtin?: string;
  canonicalUrl: string | null;
  buyUrl: string | null;
}

/** View model the page renders visible HTML from (all display-ready strings). */
export interface MarketplaceView {
  advertiserId: string;
  itemId: string;
  title: string;
  description: string;
  images: string[];
  /** Display price string, e.g. "89.00". Empty only for a non-renderable row. */
  price: string;
  priceCurrency: string;
  inStock: boolean;
  availabilityLabel: string;
  brandName: string;
  retailerName: string;
  category: string;
  sku: string;
  gtin: string;
  /** Self-referencing canonical (== the sitemap <loc>, on the served host). */
  canonicalUrl: string;
  /** Attributed BUY click-out (the retailer, via /r). Empty if unbuildable. */
  buyUrl: string;
}

// ---- validators / helpers ----

function asStringArray(v: unknown): string[] {
  if (typeof v === "string") return v.trim() ? [v] : [];
  if (Array.isArray(v))
    return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
  return [];
}

function isMarketplacePdpDto(v: unknown): v is MarketplacePdpDto {
  if (!v || typeof v !== "object") return false;
  const d = v as Record<string, unknown>;
  return (
    typeof d.advertiserId === "string" &&
    typeof d.itemId === "string" &&
    typeof d.title === "string"
  );
}

/**
 * The SAME quality floor the backend `marketplacePdpIsIndexable` enforces, so a
 * page renders iff the item is index-eligible. Below the floor ⇒ notFound().
 */
export function isRenderable(dto: MarketplacePdpDto): boolean {
  const title = (dto.title ?? "").trim();
  if (title.length === 0) return false;

  const images = asStringArray(dto.images);
  if (images.length === 0) return false;

  if (
    dto.priceMinor === null ||
    dto.priceMinor === undefined ||
    !Number.isFinite(dto.priceMinor) ||
    dto.priceMinor <= 0
  ) {
    return false;
  }

  const description = (dto.description ?? "").trim();
  if (description.length < MIN_DESCRIPTION_LENGTH) return false;
  const words = description.split(/\s+/).filter((w) => w.length > 0);
  if (words.length < MIN_DESCRIPTION_WORDS) return false;

  // Description must add info beyond the title (not a verbatim echo).
  const normDesc = description.toLowerCase();
  const normTitle = title.toLowerCase();
  if (normDesc === normTitle) return false;
  if (normDesc.replace(/[\s.,;:!?-]+$/g, "") === normTitle) return false;

  return true;
}

/** Build the self-referencing canonical on the SERVED host — equals the sitemap
 *  <loc> (same shape the backend builder emits). Prefers the DTO's own canonical
 *  (already host-normalised by the backend); reconstructs from the served host
 *  only as a fallback so the page is never without a canonical. */
export function resolveCanonicalUrl(
  dto: MarketplacePdpDto,
  advertiserId: string,
  itemId: string,
  slug: string
): string {
  const fromDto = (dto.canonicalUrl ?? "").trim();
  if (fromDto.startsWith(`${SITE_URL}/marketplace/`)) return fromDto;
  const tail = slug ? `/${encodeURIComponent(slug)}` : "";
  return `${SITE_URL}/marketplace/${encodeURIComponent(
    advertiserId
  )}/${encodeURIComponent(itemId)}${tail}`;
}

/** Integer minor units → "89.00" (fixed 2dp). Empty when no usable price. */
function formatPrice(priceMinor: number | null): string {
  if (priceMinor === null || priceMinor === undefined) return "";
  if (!Number.isFinite(priceMinor)) return "";
  return (priceMinor / 100).toFixed(2);
}

/** Map a validated DTO → the page view model. */
export function toMarketplaceView(
  dto: MarketplacePdpDto,
  advertiserId: string,
  itemId: string,
  slug: string
): MarketplaceView {
  const inStock = dto.availability === "InStock";
  return {
    advertiserId: dto.advertiserId,
    itemId: dto.itemId,
    title: dto.title.trim(),
    description: (dto.description ?? "").trim(),
    images: asStringArray(dto.images),
    price: formatPrice(dto.priceMinor),
    priceCurrency: (dto.currency || "USD").toUpperCase(),
    inStock,
    availabilityLabel: inStock ? "In stock" : "Out of stock",
    brandName: (dto.brand ?? "").trim(),
    retailerName: (dto.retailerName ?? "").trim() || "the retailer",
    category: (dto.category ?? "").trim(),
    sku: (dto.sku ?? "").trim(),
    gtin: (dto.gtin ?? "").trim(),
    canonicalUrl: resolveCanonicalUrl(dto, advertiserId, itemId, slug),
    buyUrl: (dto.buyUrl ?? "").trim(),
  };
}

/**
 * schema.org Product + Offer JSON-LD for the marketplace PDP. Seller is the
 * RETAILER (honest — the retailer is the seller of record); `url` is the
 * self-referencing canonical. Only-present fields are emitted (no empty keys).
 */
export function buildMarketplaceJsonLd(view: MarketplaceView): Record<string, unknown> {
  const availability = view.inStock
    ? "https://schema.org/InStock"
    : "https://schema.org/OutOfStock";

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${view.canonicalUrl}#product`,
    name: view.title,
    description: view.description,
    url: view.canonicalUrl,
  };
  if (view.images.length > 0) jsonLd.image = view.images;
  if (view.sku) jsonLd.sku = view.sku;
  if (view.gtin) jsonLd.gtin = view.gtin;
  if (view.brandName)
    jsonLd.brand = { "@type": "Brand", name: view.brandName };
  if (view.category) jsonLd.category = view.category;

  const offers: Record<string, unknown> = {
    "@type": "Offer",
    priceCurrency: view.priceCurrency,
    availability,
    url: view.canonicalUrl,
    seller: { "@type": "Organization", name: view.retailerName },
  };
  if (view.price) offers.price = view.price;
  jsonLd.offers = offers;

  return jsonLd;
}

/**
 * Fetch + validate + quality-gate the marketplace item. Returns the view model
 * (renderable) or null (not-found / 4xx / 5xx / unrecognised / below the quality
 * floor). Never throws — the page falls through to notFound() on null.
 *
 * Server fetch, no auth (@Public endpoint), ISR-cached 5 minutes. Both this and
 * generateMetadata call it with identical options, so Next dedupes to ONE fetch.
 */
export async function fetchMarketplaceItem(
  advertiserId: string,
  itemId: string,
  slug: string
): Promise<MarketplaceView | null> {
  const url = `${APIV3_BASE}/v2/marketplace/${encodeURIComponent(
    advertiserId
  )}/${encodeURIComponent(itemId)}`;

  let response: Response;
  try {
    response = await fetch(url, {
      next: { revalidate: 300 },
      headers: {
        Accept: "application/json",
        "User-Agent": `${SITE.name}-shopfront/1.0 (marketplace-pdp)`,
      },
    });
  } catch {
    return null; // network error → not-found, never throw
  }

  if (!response.ok) return null; // 404 = unknown/gated; 5xx = backend down

  let raw: unknown;
  try {
    raw = await response.json();
  } catch {
    return null;
  }

  if (!isMarketplacePdpDto(raw)) return null;
  if (!isRenderable(raw)) return null; // anti-spam quality floor

  return toMarketplaceView(raw, advertiserId, itemId, slug);
}
