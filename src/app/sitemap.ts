/**
 * sitemap.ts — Next.js App Router sitemap generator.
 *
 * Fetches the list of opted-in merchants from the discovery-profile
 * index endpoint and includes each /m/<slug> route.
 *
 * If the index endpoint is not yet live, the sitemap gracefully falls
 * back to static routes only — never blocks the build.
 */

import type { MetadataRoute } from "next";

const BASE_URL = "https://droplinked.com";
const APIV3_BASE = "https://apiv3.droplinked.com";

/**
 * Fetches the list of opted-in merchant slugs.
 * Returns an empty array if the endpoint is not yet live (404/500).
 */
async function fetchOptedInMerchantSlugs(): Promise<string[]> {
  try {
    const res = await fetch(`${APIV3_BASE}/v2/merchants/discovery-index`, {
      next: { revalidate: 3600 }, // 1-hour cache for sitemap builds
      headers: {
        Accept: "application/json",
        "User-Agent": "droplinked-sitemap/1.0",
      },
    });

    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data?.slugs)) return [];

    return (data.slugs as unknown[])
      .filter((s): s is string => typeof s === "string" && s.length > 0);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/claim-your-shop`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  const merchantSlugs = await fetchOptedInMerchantSlugs();

  const merchantRoutes: MetadataRoute.Sitemap = merchantSlugs.map((slug) => ({
    url: `${BASE_URL}/m/${encodeURIComponent(slug)}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...merchantRoutes];
}
