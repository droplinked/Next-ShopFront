/**
 * shop-home-data.ts
 *
 * SSR data source for the per-shop HOME page served at
 *   shop.droplinked.com/<shopUrl>[?page=N]
 *
 * WHY THIS EXISTS (measured 2026-09-09)
 * ------------------------------------
 * apiv3 advertises `https://shop.droplinked.com/{shopUrl}` as every shop's
 * canonical Store URL and roots each product canonical under it — but no
 * storefront route served it. `/roomours`, `/flower`, `/lisa` (and every
 * other shop, including ones with products) fell into the product-by-id
 * loader, missed, and rendered as a 200 `noindex` not-found shell. This
 * loader is the shop half of the one-segment route
 * (`@/lib/routing/one-segment-route.mjs` decides which half applies).
 *
 * Data sources (apiv3, @Public, no auth) — both already live:
 *   GET /shop/:shopUrl/structured-data            → Store JSON-LD + OpenGraph
 *   GET /product-v2/public/shop/:shopName?page&limit → the shop's published
 *                                                    products, paginated
 *
 * The Store endpoint is the authority on whether the shop EXISTS and is
 * servable (it applies the backend's takedown / test-scaffold predicate); a
 * 404 there is `absent` → the page 404s. The product list decorates the
 * page: its own 4xx is an empty grid, not a missing shop, while a 429 / 5xx
 * on EITHER call is `unavailable` → the page throws (never a fake 404, and a
 * shop with products is never served as an empty one).
 *
 * HOST NORMALISATION: like the product landing page (`structured-data.ts`),
 * the served canonical is reconstructed on `SITE_URL` rather than trusted
 * from the payload, so <link rel=canonical>, JSON-LD `url`/`@id` and the
 * product links all agree on the host the page is actually served from.
 */

import { SITE, SITE_URL } from "@/lib/site";
import type { CatalogProduct } from "@/lib/catalog/marketplace-catalog-data";
import { fetchUpstreamJson, type UpstreamResult } from "@/lib/upstream/fetch-upstream";
import { CATALOG } from "@/lib/seo/shop-home-indexability.mjs";
import { htmlToText } from "../../product/[slug]/lib/sanitize-html";

/** apiv3 base — overridable for dev/preview; defaults to the prod API host. */
const APIV3_BASE = (
  process.env.APIV3_BASE_URL || "https://apiv3.droplinked.com"
).replace(/\/+$/, "");

/** Grid page size — the apiv3 DTO caps `limit` at 100; 48 matches the marketplace hub. */
export const SHOP_PAGE_SIZE = 48;

// ---- view model ----

/** @see CATALOG in `@/lib/seo/shop-home-indexability.mjs`. */
export type CatalogProvenance = (typeof CATALOG)[keyof typeof CATALOG];

export interface ShopHomeView {
  shopUrl: string;
  name: string;
  /** Plain-text description, may be empty. */
  description: string;
  logoUrl: string | null;
  /** Self-referencing canonical on the served host (page 2+ canonicalises to itself). */
  canonicalUrl: string;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  /**
   * Where `total` came from. `"counted"` only when the product-list call
   * answered `ok` — a list 4xx degrades to an empty grid below, which makes a
   * bare `total === 0` ambiguous. The SEO indexability rule
   * (`@/lib/seo/shop-home-indexability.mjs`) reads THIS, never `total` alone,
   * so an uncounted catalogue can never produce a `noindex`.
   */
  catalog: CatalogProvenance;
  products: CatalogProduct[];
  /** schema.org Store JSON-LD, host-normalised to the served URL. */
  storeJsonLd: Record<string, unknown>;
}

// ---- helpers ----

/** `?page=` -> a positive integer. Anything unparseable is page 1. */
export function readPage(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const n = Number(value);
  return Number.isFinite(n) && n >= 1 ? Math.trunc(n) : 1;
}

/** Same-origin path of a shop home. Encoded: live slugs contain spaces / `@`. */
export function shopHomePath(shopUrl: string): string {
  return `/${encodeURIComponent(shopUrl)}`;
}

/**
 * Self-referencing canonical. Page 2+ canonicalises to ITSELF (as the
 * marketplace hub does): pointing deeper pages at page 1 would tell Google
 * they are duplicates and de-index the pages that link to products 49+.
 */
export function shopCanonical(shopUrl: string, page: number): string {
  const base = `${SITE_URL}${shopHomePath(shopUrl)}`;
  return page > 1 ? `${base}?page=${page}` : base;
}

/**
 * A description the page can print. Live data carries junk here — roomours'
 * description is an image URL — and imported shops carry HTML. A bare URL is
 * treated as no description; HTML is flattened to text.
 */
export function cleanDescription(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const text = raw.trim();
  if (!text) return "";
  if (/^https?:\/\/\S+$/i.test(text)) return "";
  return htmlToText(text, 300);
}

function asString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function unrecognised(status: number): UpstreamResult<never> {
  return { outcome: "unavailable", status, reason: "unrecognised payload" };
}

// ---- Store structured-data ----

interface StoreEnvelope {
  name: string;
  description: string;
  logoUrl: string | null;
  jsonLd: Record<string, unknown>;
}

function parseStore(raw: unknown): StoreEnvelope | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const jsonLd = r.jsonLd;
  if (!jsonLd || typeof jsonLd !== "object") return null;
  const ld = jsonLd as Record<string, unknown>;
  if (ld["@type"] !== "Store") return null;
  const name = asString(ld.name);
  if (!name) return null;
  const og =
    r.openGraph && typeof r.openGraph === "object"
      ? (r.openGraph as Record<string, unknown>)
      : {};
  const logo = asString(og["og:image"]) || asString(ld.logo) || asString(ld.image);
  return {
    name,
    description: cleanDescription(ld.description ?? og["og:description"]),
    logoUrl: logo || null,
    jsonLd: ld,
  };
}

// ---- product list ----

interface RawImage {
  original?: string | null;
  thumbnail?: string | null;
}
interface RawProductRow {
  id?: string;
  title?: string;
  slug?: string | null;
  images?: RawImage[] | null;
  lowestPrice?: number | null;
}
interface ProductPage {
  products: CatalogProduct[];
  total: number;
  totalPages: number;
}

function toCatalogProduct(shopUrl: string, row: RawProductRow): CatalogProduct | null {
  const id = asString(row.id);
  const title = asString(row.title);
  const slug = asString(row.slug);
  // No slug => no resolvable `/{shop}/product/{slug}` link => no tile. A tile
  // that leads a crawler to a 404 is worse than no tile.
  if (!id || !title || !slug) return null;
  const img = (row.images ?? []).find((i) => i?.thumbnail || i?.original);
  return {
    id,
    title,
    href: `${shopHomePath(shopUrl)}/product/${encodeURIComponent(slug)}`,
    imageUrl: img?.thumbnail || img?.original || null,
    price:
      typeof row.lowestPrice === "number" && row.lowestPrice >= 0 ? row.lowestPrice : 0,
    // The shop name is the page's <h1>; repeating it on every tile is noise.
    shopName: "",
  };
}

/**
 * Unwrap the TransformInterceptor envelope `{ statusCode, message, data }`
 * around a `PaginationResult` (`{ data: [...], totalDocuments, totalPages }`).
 */
function parseProductPage(shopUrl: string, raw: unknown): ProductPage | null {
  if (!raw || typeof raw !== "object") return null;
  const outer = raw as Record<string, unknown>;
  const inner =
    outer.data && typeof outer.data === "object" && !Array.isArray(outer.data)
      ? (outer.data as Record<string, unknown>)
      : outer;
  const list = inner.data;
  if (!Array.isArray(list)) return null;
  const products: CatalogProduct[] = [];
  for (const entry of list) {
    if (!entry || typeof entry !== "object") continue;
    const p = toCatalogProduct(shopUrl, entry as RawProductRow);
    if (p) products.push(p);
  }
  const total = Number(inner.totalDocuments);
  const totalPages = Number(inner.totalPages);
  return {
    products,
    total: Number.isFinite(total) ? Math.trunc(total) : products.length,
    totalPages: Number.isFinite(totalPages) ? Math.max(1, Math.trunc(totalPages)) : 1,
  };
}

// ---- fetcher ----

const HEADERS = {
  Accept: "application/json",
  "User-Agent": `${SITE.name}-shopfront/1.0 (shop-home)`,
};

/**
 * Resolve a shop home. Never throws.
 *
 *   ok           the shop + one page of its products
 *   absent       the shop does not exist / is not servable (Store 404), or
 *                the requested page is past the end → `notFound()`
 *   unavailable  apiv3 throttled / down / unreachable on either call → the
 *                page throws (HTTP 5xx, uncached)
 */
export async function fetchShopHome(
  shopUrl: string,
  page = 1
): Promise<UpstreamResult<ShopHomeView>> {
  const safePage = Number.isFinite(page) ? Math.max(1, Math.trunc(page)) : 1;
  const encoded = encodeURIComponent(shopUrl);

  const storeResult = await fetchUpstreamJson(
    `${APIV3_BASE}/shop/${encoded}/structured-data`,
    // 1h — matches the endpoint's own Cache-Control: max-age=3600.
    { next: { revalidate: 3600 }, headers: HEADERS }
  );
  if (storeResult.outcome !== "ok") return storeResult;
  const store = parseStore(storeResult.body);
  if (!store) return unrecognised(storeResult.status);

  const listResult = await fetchUpstreamJson(
    `${APIV3_BASE}/product-v2/public/shop/${encoded}?page=${safePage}&limit=${SHOP_PAGE_SIZE}`,
    // 5 min — product availability/price moves faster than the Store record.
    { next: { revalidate: 300 }, headers: HEADERS }
  );
  if (listResult.outcome === "unavailable") return listResult;

  // The shop exists (Store said so). A 4xx from the product list is "no
  // grid", not "no shop" — an honest empty catalogue is a 200.
  //
  // But "no grid because the list 4xx'd" and "no grid because the shop really
  // has nothing" are DIFFERENT facts, and the SEO layer must not confuse them:
  // only the second may ever produce a `noindex`. `catalog` carries that
  // distinction out of here instead of letting `total: 0` swallow it.
  let grid: ProductPage = { products: [], total: 0, totalPages: 1 };
  let catalog: CatalogProvenance = CATALOG.UNCOUNTED;
  if (listResult.outcome === "ok") {
    const parsed = parseProductPage(shopUrl, listResult.body);
    if (!parsed) return unrecognised(listResult.status);
    grid = parsed;
    catalog = CATALOG.COUNTED;
  }

  // Past the last page: absent, like the marketplace hub. Page 1 of an empty
  // shop is still the shop's home.
  if (safePage > 1 && grid.products.length === 0) {
    return { outcome: "absent", status: listResult.status };
  }

  const canonicalUrl = shopCanonical(shopUrl, safePage);
  const storeJsonLd: Record<string, unknown> = {
    ...store.jsonLd,
    "@id": `${shopCanonical(shopUrl, 1)}#store`,
    url: shopCanonical(shopUrl, 1),
  };
  // The raw description is not printable (see cleanDescription); keep the
  // JSON-LD honest with the same text the page shows, or drop it.
  if (store.description) storeJsonLd.description = store.description;
  else delete storeJsonLd.description;

  return {
    outcome: "ok",
    status: storeResult.status,
    body: {
      shopUrl,
      name: store.name,
      description: store.description,
      logoUrl: store.logoUrl,
      canonicalUrl,
      page: safePage,
      pageSize: SHOP_PAGE_SIZE,
      total: grid.total,
      totalPages: grid.totalPages,
      catalog,
      products: grid.products,
      storeJsonLd,
    },
  };
}
