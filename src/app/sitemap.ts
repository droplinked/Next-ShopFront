import type { MetadataRoute } from 'next';

/**
 * Minimal sitemap. Currently only enumerates marketing surfaces that
 * benefit from search-engine indexing (the merchant displacement
 * landing). Product pages stay out — they live under the host
 * merchant's shop domain, not under this shopfront's marketing slug.
 *
 * The site host is read from `NEXT_PUBLIC_SITE_URL` so prod and dev
 * surface the right canonical. Falls back to a relative path which
 * Next.js + most crawlers tolerate gracefully.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  const lastModified = new Date();
  return [
    {
      url: `${base}/affiliate-vs-networks`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ];
}
