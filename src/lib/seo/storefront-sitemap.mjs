/**
 * storefront-sitemap.mjs — what `shop.droplinked.com/sitemap.xml` and
 * `/robots.txt` advertise, and the ONE guard that keeps a foreign host out.
 *
 * WHY THIS EXISTS (measured 2026-09-09)
 * ------------------------------------
 * `shop.droplinked.com/sitemap.xml` emitted exactly two `<loc>`s — both on
 * `https://droplinked.com` (the marketing host, not the host serving the
 * sitemap) — and `/robots.txt` advertised `https://droplinked.com/sitemap.xml`.
 * A sitemap may only list URLs on the host it is served from (sitemaps.org
 * "location" rule); every entry was therefore ignored, and the storefront's
 * own indexable pages were advertised nowhere. The merchant tier it also
 * tried to build read `apiv3 /v2/merchants/discovery-index`, which is
 * HTTP 404 (`Cannot GET`), so it contributed nothing on every render.
 *
 * WHAT THIS SITEMAP IS — AND IS NOT
 * ---------------------------------
 * It lists the storefront's OWN static, indexable routes. It does NOT list
 * the ~5,700 shop homes or their products: droplinked-backend owns the shop
 * list, the servability predicate (takedown / test-scaffold / reserved
 * slug) and the per-shop sitemaps at
 * `apiv3.droplinked.com/seo/sitemap-index.xml` → `/seo/sitemap/{shop}.xml`,
 * plus the `sitemap-loc-truth` gate that fetches every advertised URL back.
 * Re-deriving that list here would be a second, drift-prone copy of the
 * backend's predicate. What THIS host must do is point crawlers at that
 * plane: sitemaps.org cross-host submission is honoured when the sitemap is
 * referenced from the robots.txt of the host whose URLs it lists — see
 * `SHOP_SITEMAP_INDEX_URL` and `src/app/robots.ts`.
 *
 * Plain ESM on purpose: this repo's `npm test` is Node's built-in runner with
 * no TypeScript transform, and the manifest + guard are exercised by
 * `src/__smoke__/storefront-sitemap.smoke.test.mjs` against THIS module —
 * including a check that every listed path is a real `page.tsx`.
 */

/**
 * The backend-owned sitemap index whose children list every public shop's
 * product URLs on `shop.droplinked.com` (5,732 children measured 2026-09-09).
 * Advertised from `/robots.txt` so the cross-host listing is authoritative
 * for this host. Pinned to prod apiv3 deliberately: it must name the index
 * whose `<loc>`s live on the host serving robots.txt, whatever apiv3 base
 * the SSR loaders talk to.
 */
export const SHOP_SITEMAP_INDEX_URL = 'https://apiv3.droplinked.com/seo/sitemap-index.xml';

/**
 * @typedef {'always'|'hourly'|'daily'|'weekly'|'monthly'|'yearly'|'never'} ChangeFrequency
 * @typedef {{ path: string, changeFrequency: ChangeFrequency, priority: number, requiresRootCatalog?: boolean }} StaticRoute
 * @typedef {{ url: string, lastModified: Date, changeFrequency: ChangeFrequency, priority: number }} SitemapEntry
 */

/**
 * The storefront's static, indexable routes. Each `path` must be served by a
 * `page.tsx` under `src/app` (the smoke test walks the tree and fails when
 * one is not). Measured on prod 2026-09-09: every one of these answers 200
 * with its own `<title>` and no `noindex`.
 *
 * `/` renders the aggregate catalog only when `ROOT_CATALOG_ENABLED`; with
 * the flag off it redirects to `/home`, and a sitemap must not list a
 * redirect — hence `requiresRootCatalog`.
 *
 * @type {ReadonlyArray<StaticRoute>}
 */
export const STOREFRONT_STATIC_ROUTES = Object.freeze([
  { path: '/', changeFrequency: 'daily', priority: 1, requiresRootCatalog: true },
  { path: '/marketplace', changeFrequency: 'daily', priority: 0.8 },
  { path: '/claim-your-shop', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.3 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.3 },
  { path: '/shipping-policy', changeFrequency: 'monthly', priority: 0.2 },
  { path: '/returns-policy', changeFrequency: 'monthly', priority: 0.2 },
  { path: '/privacy-policy', changeFrequency: 'yearly', priority: 0.1 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.1 },
]);

/**
 * Origin of a base URL (`https://host`), with no trailing slash. Throws on
 * an unparseable base — a misconfigured SITE_URL must fail the build, not
 * silently publish a sitemap on the wrong host.
 *
 * @param {string} baseUrl
 * @returns {string}
 */
export function originOf(baseUrl) {
  return new URL(baseUrl).origin;
}

/**
 * Build the storefront's sitemap entries on ONE host.
 *
 * @param {{ baseUrl: string, rootCatalogEnabled: boolean, now?: Date }} options
 * @returns {SitemapEntry[]}
 */
export function buildStorefrontSitemap({ baseUrl, rootCatalogEnabled, now = new Date() }) {
  const origin = originOf(baseUrl);
  /** @type {SitemapEntry[]} */
  const entries = [];
  for (const route of STOREFRONT_STATIC_ROUTES) {
    if (route.requiresRootCatalog && !rootCatalogEnabled) continue;
    entries.push({
      url: `${origin}${route.path}`,
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    });
  }
  return entries;
}

/**
 * The guard: split entries into the ones on `baseUrl`'s origin and the ones
 * that are not. The sitemap route emits only `kept` and logs `rejected`, so
 * a future entry built on the wrong host (the exact defect this file fixes)
 * is dropped at the boundary instead of being served and ignored.
 *
 * @template {{ url: string }} E
 * @param {ReadonlyArray<E>} entries
 * @param {string} baseUrl
 * @returns {{ kept: E[], rejected: E[] }}
 */
export function partitionByHost(entries, baseUrl) {
  const origin = originOf(baseUrl);
  /** @type {E[]} */
  const kept = [];
  /** @type {E[]} */
  const rejected = [];
  for (const entry of entries) {
    let sameOrigin = false;
    try {
      sameOrigin = new URL(entry.url).origin === origin;
    } catch {
      sameOrigin = false;
    }
    (sameOrigin ? kept : rejected).push(entry);
  }
  return { kept, rejected };
}
