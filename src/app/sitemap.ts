/**
 * sitemap.ts — `GET /sitemap.xml` for the host this app is served on
 * (`SITE_URL`, https://shop.droplinked.com).
 *
 * The rules live in `@/lib/seo/storefront-sitemap.mjs` (plain ESM so
 * `npm test` exercises them); this file is the Next.js adapter. It lists the
 * storefront's own static routes only — shop homes and products are
 * advertised by droplinked-backend's sitemap plane, which `/robots.txt`
 * points at (see that module's header for why the split is deliberate).
 *
 * Every entry is host-checked at this boundary: a `<loc>` on any other
 * origin is dropped and logged, never served (2026-09-09: this route served
 * two `https://droplinked.com` URLs and nothing else).
 */

import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { ROOT_CATALOG_ENABLED } from "@/lib/variables/variables";
import { buildStorefrontSitemap, partitionByHost } from "@/lib/seo/storefront-sitemap.mjs";

export default function sitemap(): MetadataRoute.Sitemap {
  const entries = buildStorefrontSitemap({
    baseUrl: SITE_URL,
    rootCatalogEnabled: ROOT_CATALOG_ENABLED,
  });
  const { kept, rejected } = partitionByHost(entries, SITE_URL);
  if (rejected.length > 0) {
    console.error(
      `[sitemap] dropped ${rejected.length} entr${rejected.length === 1 ? "y" : "ies"} not on ${SITE_URL}:`,
      rejected.map((e) => e.url)
    );
  }
  return kept;
}
