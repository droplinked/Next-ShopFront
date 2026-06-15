/**
 * robots.ts — Next.js App Router robots.txt generator.
 *
 * /m/* is explicitly allowed for all crawlers so LLM search engines
 * (ChatGPT, Claude, Perplexity, Google SGE) can ingest merchant pages.
 */

import type { MetadataRoute } from "next";

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
    sitemap: "https://droplinked.com/sitemap.xml",
  };
}
