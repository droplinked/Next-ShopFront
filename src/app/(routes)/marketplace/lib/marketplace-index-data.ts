/**
 * marketplace-index-data.ts
 *
 * SSR data source for the marketplace INDEX and per-advertiser HUB pages —
 * the internal-link spine that un-orphans the PDP corpus.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS EXISTS — measured, not assumed
 * ---------------------------------------------------------------------------
 * On 2026-08-01 the marketplace PDP corpus was 11,642 URLs with 83 indexed
 * (0.71%). GSC URL Inspection on a sample — including one from the TOP-
 * impression advertiser — returned, identically:
 *
 *     coverage  = "Discovered - currently not indexed"
 *     lastCrawl = NEVER
 *     canonical = googleCanonical == userCanonical  (no conflict)
 *
 * Everything upstream was healthy: sitemap submitted to GSC (11,642 URLs, 0
 * errors), PDPs server-render real content to Googlebot, robots allows
 * /marketplace/, every PDP self-canonicalises with index,follow.
 *
 * The break was the INTERNAL LINK GRAPH:
 *   GET /marketplace             -> HTTP 200, 0 links to any PDP
 *   GET /marketplace/:advertiser -> HTTP 404 (no hub route existed)
 *   PDP -> sibling PDPs          -> 0
 *
 * Worse, that 200 was not even a marketplace page: `marketplace` was falling
 * through to the sibling dynamic `[productId]` route and rendering as a
 * product named "marketplace" — a soft-404 served 200 at the natural parent
 * of the entire corpus. Adding a STATIC `marketplace/page.tsx` shadows that
 * route (Next resolves static segments before dynamic ones) and fixes both.
 *
 * Every PDP was therefore an orphan, reachable only via the sitemap. Internal
 * linking is Google's primary page-importance signal, so a zero-inbound-link
 * page gets near-zero crawl priority no matter how clean the sitemap is.
 * "Discovered - currently not indexed" at 99.3% is the textbook fingerprint.
 *
 * Data source (apiv3, @Public, no auth):
 *   GET /v2/marketplace                 -> advertisers with indexable supply
 *   GET /v2/marketplace/:advertiserId   -> that advertiser's items, paginated
 *
 * BE dependency (droplinked-backend):
 *   src/modules/marketplace-pdp/controllers/marketplace-index.controller.ts
 *
 * ---------------------------------------------------------------------------
 * GATING — inherited, not duplicated
 * ---------------------------------------------------------------------------
 * There is deliberately NO separate frontend feature flag. The backend gates
 * both endpoints on `MARKETPLACE_PDP_ENABLED` + the advertiser allowlist and
 * 404s when either is off; a 404 here returns null and the page calls
 * `notFound()`. So the pages are already fail-closed on the backend flag, and
 * a second flag would only add a way for the two to disagree.
 *
 * The same property is what makes it safe to add breadcrumb links on the PDP:
 * the PDP renders them only when this fetch SUCCEEDED, so we can never emit an
 * internal link to a page the backend is currently 404ing.
 */

import { SITE, SITE_URL } from "@/lib/site";

/** apiv3 base — overridable for dev/preview; defaults to the prod API host. */
const APIV3_BASE = (
  process.env.APIV3_BASE_URL || "https://apiv3.droplinked.com"
).replace(/\/+$/, "");

/**
 * Must match the backend's HUB_PAGE_SIZE. Both the hub page and the PDP's
 * "more from" rail request this exact page size so they resolve to the SAME
 * fetch-cache entry — one origin request per advertiser per hour, not one per
 * rendered PDP.
 */
export const HUB_PAGE_SIZE = 48;

/** How many siblings the PDP rail shows. Enough to be a real link edge, few
 *  enough not to bury the product the shopper actually came for. */
export const PDP_SIBLING_COUNT = 8;

// ---- view models ----

export interface MarketplaceAdvertiserSummary {
  advertiserId: string;
  /** Indexable item count (what the hub will actually render). */
  itemCount: number;
  /** Display label: the representative brand, or a neutral fallback. */
  label: string;
  /** Same-origin path to this advertiser's hub. */
  href: string;
}

export interface MarketplaceIndexView {
  advertisers: MarketplaceAdvertiserSummary[];
  total: number;
}

export interface MarketplaceHubItem {
  itemId: string;
  title: string;
  /** Same-origin path derived from the item's canonical URL. */
  href: string;
  image: string | null;
  brand: string;
}

export interface MarketplaceHubView {
  advertiserId: string;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  /** Display label for the advertiser (brand when known). */
  label: string;
  items: MarketplaceHubItem[];
}

// ---- helpers ----

/**
 * Canonical URL -> same-origin path, or null.
 *
 * Two properties matter here, and both are security properties rather than
 * cosmetic ones:
 *
 *  1. We never emit an OFF-ORIGIN href into what reads as an internal product
 *     grid. The marketplace click-out to the retailer is a separate, disclosed,
 *     `rel="sponsored nofollow"` control on the PDP; a grid tile silently
 *     leaving the site would be exactly the affiliate-doorway pattern these
 *     pages exist to not be.
 *  2. A protocol-relative value ("//evil.example/x") is rejected. It looks like
 *     a path to a naive prefix check but resolves off-origin in a browser.
 *
 * Anything that is not a plain `/marketplace/...` path on our own host is
 * dropped rather than repaired — the item simply does not appear.
 */
export function toInternalPath(canonicalUrl: unknown): string | null {
  if (typeof canonicalUrl !== "string") return null;
  const url = canonicalUrl.trim();
  if (!url.startsWith(`${SITE_URL}/marketplace/`)) return null;
  const path = url.slice(SITE_URL.length);
  if (!path.startsWith("/marketplace/")) return null;
  if (path.startsWith("//")) return null;
  return path;
}

/** Advertiser id -> hub path. Ids are numeric-ish strings from Impact. */
export function advertiserHubPath(advertiserId: string): string {
  return `/marketplace/${encodeURIComponent(advertiserId)}`;
}

/**
 * Label for an advertiser. Brand when the supply carries one; otherwise a
 * neutral descriptor rather than a bare numeric id — a page of raw ids is
 * precisely the thin, machine-generated shape we are trying to escape, and we
 * do not invent a brand name we were not given.
 */
function advertiserLabel(brand: unknown): string {
  const b = typeof brand === "string" ? brand.trim() : "";
  return b || "Partner retailer";
}

/** Shared, never-throwing JSON GET. Null on network error / non-2xx / bad JSON. */
async function getJson(url: string): Promise<unknown | null> {
  let response: Response;
  try {
    response = await fetch(url, {
      // 1h — matches the page ISR window and the endpoint's own
      // Cache-Control: max-age=3600.
      next: { revalidate: 3600 },
      headers: {
        Accept: "application/json",
        "User-Agent": `${SITE.name}-shopfront/1.0 (marketplace-index)`,
      },
    });
  } catch {
    return null; // network error -> not-found, never throw
  }
  if (!response.ok) return null; // 404 = disabled/not allowlisted; 5xx = down
  try {
    return await response.json();
  } catch {
    return null;
  }
}

// ---- fetchers ----

/**
 * The advertiser index. Returns null when the endpoint is disabled, empty, or
 * unreachable — the page then calls `notFound()` rather than rendering an
 * empty grid, because an empty index page is a soft-404 and putting one in the
 * corpus is worse than not having the page at all.
 */
export async function fetchMarketplaceIndex(): Promise<MarketplaceIndexView | null> {
  const raw = await getJson(`${APIV3_BASE}/v2/marketplace`);
  if (!raw || typeof raw !== "object") return null;

  const list = (raw as Record<string, unknown>).advertisers;
  if (!Array.isArray(list)) return null;

  const advertisers: MarketplaceAdvertiserSummary[] = [];
  for (const entry of list) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const advertiserId =
      typeof row.advertiserId === "string" ? row.advertiserId.trim() : "";
    const itemCount = Number(row.itemCount);
    // Zero-supply advertisers are already omitted by the backend; re-checking
    // here keeps the invariant local — we never link to a hub that would 404.
    if (!advertiserId || !Number.isFinite(itemCount) || itemCount <= 0) continue;
    advertisers.push({
      advertiserId,
      itemCount: Math.trunc(itemCount),
      label: advertiserLabel(row.brand),
      href: advertiserHubPath(advertiserId),
    });
  }

  if (advertisers.length === 0) return null;

  // Largest catalogues first: the highest-value crawl paths appear before the
  // fold, and the ordering is stable across renders (ids break ties).
  advertisers.sort(
    (a, b) =>
      b.itemCount - a.itemCount || a.advertiserId.localeCompare(b.advertiserId)
  );

  return { advertisers, total: advertisers.length };
}

/**
 * One advertiser's indexable items, paginated. Null when disabled, not
 * allowlisted, out of range, or unreachable — all indistinguishable by design,
 * so this cannot be used to read the allowlist.
 */
export async function fetchAdvertiserHub(
  advertiserId: string,
  page = 1
): Promise<MarketplaceHubView | null> {
  const safePage = Number.isFinite(page) ? Math.max(1, Math.trunc(page)) : 1;
  const url =
    `${APIV3_BASE}/v2/marketplace/${encodeURIComponent(advertiserId)}` +
    `?page=${safePage}&pageSize=${HUB_PAGE_SIZE}`;

  const raw = await getJson(url);
  if (!raw || typeof raw !== "object") return null;

  const dto = raw as Record<string, unknown>;
  const list = dto.items;
  if (!Array.isArray(list)) return null;

  const items: MarketplaceHubItem[] = [];
  for (const entry of list) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const href = toInternalPath(row.canonicalUrl);
    const itemId = typeof row.itemId === "string" ? row.itemId.trim() : "";
    const title = typeof row.title === "string" ? row.title.trim() : "";
    // No href or no title => no tile. A grid tile with nothing to click, or
    // nothing to read, is a link we would be asking a crawler to follow into
    // a dead end.
    if (!href || !itemId || !title) continue;
    const image =
      typeof row.image === "string" && row.image.trim() ? row.image.trim() : null;
    items.push({
      itemId,
      title,
      href,
      image,
      brand: typeof row.brand === "string" ? row.brand.trim() : "",
    });
  }

  if (items.length === 0) return null;

  const total = Number(dto.total);
  const totalPages = Number(dto.totalPages);
  const brandLabel = items.find((i) => i.brand)?.brand ?? "";

  return {
    advertiserId,
    page: safePage,
    pageSize: HUB_PAGE_SIZE,
    total: Number.isFinite(total) ? Math.trunc(total) : items.length,
    totalPages: Number.isFinite(totalPages) ? Math.max(1, Math.trunc(totalPages)) : 1,
    label: advertiserLabel(brandLabel),
    items,
  };
}

/**
 * Siblings for the PDP rail — the PDP -> PDP link edge that was missing.
 *
 * Requests page 1 at the shared page size on purpose: the URL is byte-identical
 * to the hub page's own page-1 request, so both resolve to ONE fetch-cache
 * entry. The cost of this rail across the whole corpus is one origin request
 * per advertiser per hour, not one per PDP.
 */
export async function fetchPdpSiblings(
  advertiserId: string,
  excludeItemId: string
): Promise<{ hub: MarketplaceHubView; siblings: MarketplaceHubItem[] } | null> {
  const hub = await fetchAdvertiserHub(advertiserId, 1);
  if (!hub) return null;
  const siblings = hub.items
    .filter((i) => i.itemId !== excludeItemId)
    .slice(0, PDP_SIBLING_COUNT);
  return { hub, siblings };
}
