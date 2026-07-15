/**
 * marketplace-catalog-data.ts
 *
 * SSR data source for the aggregate product catalog served at the platform
 * root (shop.droplinked.com/). Fetches the cross-shop public marketplace grid
 * from apiv3 (@Public, no auth, no x-shop-id — the identifier-in-path pattern
 * used by the other SSR routes):
 *
 *   GET {APIV3}/product-v2/public/marketplace?page&limit&type  →  PaginationResult<MarketplaceGridProduct>
 *
 * BE dependency (droplinked-backend):
 *   src/modules/product-v2/controllers/product-v2.controller.ts  (@Get('public/marketplace'))
 *   src/modules/product-v2/repositories/product-v2.repository.ts (getPublicMarketplaceProducts)
 *
 * The endpoint already gates OUT non-shoppable shops (disabled/archived/test)
 * and products (draft/hidden/unpublished), so this loader only shapes the rows
 * into a render view model and drops any item that can't build a valid card
 * link. Never throws: on 4xx/5xx/network/unrecognised payload it returns an
 * empty catalog so the root page still renders (a real page, never a 404), and
 * the flag can be flipped off if the backend is unavailable.
 */

import { SITE } from "@/lib/site";

/** apiv3 base — overridable for dev/preview; defaults to the prod API host. */
const APIV3_BASE = (
  process.env.APIV3_BASE_URL || "https://apiv3.droplinked.com"
).replace(/\/+$/, "");

// ---- shape of the apiv3 MarketplaceGridProduct row (subset we consume) ----

interface RawImage {
  original?: string | null;
  thumbnail?: string | null;
  alt?: string | null;
}

interface RawMarketplaceProduct {
  id?: string;
  title?: string;
  slug?: string | null;
  thumbnail?: string | null;
  images?: RawImage[] | null;
  defaultImageIndex?: number | null;
  lowestPrice?: number | null;
  shopSlug?: string | null;
  shopName?: string | null;
}

// ---- render view model ----

export interface CatalogProduct {
  id: string;
  title: string;
  /** Same-origin PDP link `/{shopSlug}/product/{productSlug}` (GMC g:link shape). */
  href: string;
  imageUrl: string | null;
  /** Lowest SKU price in major units (dollars) — SkuV2.price is a Float. */
  price: number;
  shopName: string;
}

export interface MarketplaceCatalog {
  products: CatalogProduct[];
  total: number;
}

function resolveImage(p: RawMarketplaceProduct): string | null {
  if (p.thumbnail) return p.thumbnail;
  const images = p.images ?? [];
  if (images.length === 0) return null;
  const idx =
    typeof p.defaultImageIndex === "number" &&
    p.defaultImageIndex >= 0 &&
    p.defaultImageIndex < images.length
      ? p.defaultImageIndex
      : 0;
  const img = images[idx] || images[0];
  return img?.thumbnail || img?.original || null;
}

function toCatalogProduct(p: RawMarketplaceProduct): CatalogProduct | null {
  const shopSlug = (p.shopSlug || "").trim();
  const productSlug = (p.slug || "").trim();
  // Both are required to build a resolvable `/{shop}/product/{slug}` link; the
  // backend already excludes shops with no slug/url, this guards the edge.
  if (!shopSlug || !productSlug || !p.id || !p.title) return null;
  return {
    id: p.id,
    title: p.title,
    href: `/${shopSlug}/product/${productSlug}`,
    imageUrl: resolveImage(p),
    price: typeof p.lowestPrice === "number" && p.lowestPrice >= 0 ? p.lowestPrice : 0,
    shopName: p.shopName || "",
  };
}

const EMPTY: MarketplaceCatalog = { products: [], total: 0 };

/**
 * Fetch + shape the cross-shop marketplace grid. Returns an empty catalog on
 * any failure (never throws) so the root page renders regardless. Server fetch,
 * no auth, ISR-cached 5 minutes; generateMetadata + the page share one fetch.
 */
export async function fetchMarketplaceCatalog(params?: {
  page?: number;
  limit?: number;
  type?: "physical" | "digital" | "pod";
}): Promise<MarketplaceCatalog> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 48;
  // No `type` → show ALL shoppable product types (physical + pod + digital).
  // The MoR / GMC feed catalog is mostly `pod` (print-on-demand), so defaulting
  // to `physical` hid it — the root grid must mirror the full approved catalog,
  // not just physical goods. Callers can still pass an explicit type to narrow.
  const type = params?.type;
  const typeParam = type ? `&type=${encodeURIComponent(type)}` : "";
  const url = `${APIV3_BASE}/product-v2/public/marketplace?page=${page}&limit=${limit}${typeParam}`;

  let response: Response;
  try {
    response = await fetch(url, {
      next: { revalidate: 300 },
      headers: {
        Accept: "application/json",
        "User-Agent": `${SITE.name}-shopfront/1.0 (marketplace-root)`,
      },
    });
  } catch {
    return EMPTY; // network error → empty catalog, never throw
  }

  if (!response.ok) return EMPTY;

  let raw: unknown;
  try {
    raw = await response.json();
  } catch {
    return EMPTY;
  }

  // product-v2 routes are wrapped by the class-level TransformInterceptor:
  //   { statusCode, message, data: { data: [...], currentPage, totalDocuments } }
  // So unwrap the interceptor envelope (when present), then read the inner
  // PaginationResult. The `!Array.isArray` check keeps this correct even if the
  // wrapper is ever removed (payload would then be the PaginationResult itself).
  const outer = raw as { data?: unknown; totalDocuments?: unknown; total?: unknown };
  const payload =
    (outer?.data && !Array.isArray(outer.data)
      ? (outer.data as { data?: unknown; totalDocuments?: unknown; total?: unknown })
      : outer) ?? {};
  const rows = Array.isArray(payload.data) ? (payload.data as RawMarketplaceProduct[]) : [];
  const products = rows
    .map(toCatalogProduct)
    .filter((p): p is CatalogProduct => p !== null);
  const total =
    typeof payload.totalDocuments === "number"
      ? payload.totalDocuments
      : typeof payload.total === "number"
        ? payload.total
        : products.length;

  return { products, total };
}
