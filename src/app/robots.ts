/**
 * robots.ts — `GET /robots.txt` for the host this app is served on
 * (`SITE_URL`, https://shop.droplinked.com).
 *
 * Two sitemaps are advertised, both on purpose:
 *   1. this host's own `/sitemap.xml` (static routes — `src/app/sitemap.ts`)
 *   2. droplinked-backend's `/seo/sitemap-index.xml` on apiv3, whose 5,7xx
 *      per-shop children list this host's product URLs. sitemaps.org only
 *      honours a sitemap for URLs on another host when the robots.txt of
 *      THAT host references it — this line is what makes the backend's
 *      listing count for shop.droplinked.com. (2026-09-09: the only
 *      `Sitemap:` line was `https://droplinked.com/sitemap.xml` — a third
 *      host, and not this app's file at all.)
 *
 * /m/* stays explicitly allowed for all crawlers so LLM search engines
 * (ChatGPT, Claude, Perplexity, Google SGE) can ingest merchant pages.
 */

import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { SHOP_SITEMAP_INDEX_URL } from "@/lib/seo/storefront-sitemap.mjs";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/m/",    // per-merchant landing pages — AEO/GEO crawl target
        ],
        disallow: [
          "/api/",
          "/_next/",
          "/checkout",
          "/orders",
        ],
      },
    ],
    sitemap: [`${SITE_URL}/sitemap.xml`, SHOP_SITEMAP_INDEX_URL],
  };
}
