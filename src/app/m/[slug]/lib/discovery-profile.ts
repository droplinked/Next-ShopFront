/**
 * discovery-profile.ts
 *
 * Fetches and parses the per-merchant discovery profile from:
 *   apiv3.droplinked.com/v2/merchants/:slug/discovery-profile
 *
 * BE dependency: droplinked-backend#2096 (KYB tier filter).
 * If the endpoint is not yet live, the fetch returns null and the
 * page falls through to notFound() — fully 5xx-safe.
 *
 * No zod dependency (not in project). TypeScript type guards + runtime
 * narrowing are used instead for validation.
 */

export type VerifiedTier = "full" | "directory_only";

export interface DiscoveryProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  imageUrl: string;
  productUrl: string;
}

export interface DiscoveryProfile {
  slug: string;
  name: string;
  description: string;
  logoUrl: string;
  websiteUrl: string;
  storefrontUrl: string;
  verifiedTier: VerifiedTier;
  /** Top products — up to 8 for `full` tier, empty for `directory_only` */
  topProducts: DiscoveryProduct[];
  /** Social links — optional */
  social?: {
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
}

const APIV3_BASE = "https://apiv3.droplinked.com";

// ---- runtime validators ----

function isVerifiedTier(v: unknown): v is VerifiedTier {
  return v === "full" || v === "directory_only";
}

function isDiscoveryProduct(v: unknown): v is DiscoveryProduct {
  if (!v || typeof v !== "object") return false;
  const p = v as Record<string, unknown>;
  return (
    typeof p.id === "string" &&
    typeof p.title === "string" &&
    typeof p.price === "number" &&
    typeof p.currency === "string"
  );
}

function parseDiscoveryProfile(raw: unknown): DiscoveryProfile | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  if (
    typeof r.slug !== "string" ||
    typeof r.name !== "string" ||
    typeof r.description !== "string" ||
    !isVerifiedTier(r.verifiedTier)
  ) {
    return null;
  }

  const topProducts: DiscoveryProduct[] = Array.isArray(r.topProducts)
    ? (r.topProducts as unknown[]).filter(isDiscoveryProduct).slice(0, 8)
    : [];

  const social =
    r.social && typeof r.social === "object"
      ? (r.social as Record<string, unknown>)
      : undefined;

  return {
    slug: r.slug,
    name: r.name,
    description: r.description,
    logoUrl: typeof r.logoUrl === "string" ? r.logoUrl : "",
    websiteUrl: typeof r.websiteUrl === "string" ? r.websiteUrl : "",
    storefrontUrl:
      typeof r.storefrontUrl === "string"
        ? r.storefrontUrl
        : `https://droplinked.io/${r.slug}`,
    verifiedTier: r.verifiedTier,
    topProducts,
    social: social
      ? {
          twitter:
            typeof social.twitter === "string" ? social.twitter : undefined,
          instagram:
            typeof social.instagram === "string" ? social.instagram : undefined,
          linkedin:
            typeof social.linkedin === "string" ? social.linkedin : undefined,
        }
      : undefined,
  };
}

/**
 * Fetches the discovery profile for a merchant slug.
 * Returns null if the endpoint returns 404, 500, or an unrecognised payload.
 * Never throws — callers should fall through to notFound() on null.
 */
export async function fetchDiscoveryProfile(
  slug: string
): Promise<DiscoveryProfile | null> {
  const url = `${APIV3_BASE}/v2/merchants/${encodeURIComponent(slug)}/discovery-profile`;

  let response: Response;
  try {
    response = await fetch(url, {
      // ISR revalidation is controlled at the page level (revalidate = 300).
      // Bypass Next.js fetch cache here so the page-level ISR is authoritative.
      next: { revalidate: 300 },
      headers: {
        Accept: "application/json",
        "User-Agent": "droplinked-shopfront/1.0 (AEO-crawler-friendly)",
      },
    });
  } catch {
    // Network error (DNS, timeout, etc.)
    return null;
  }

  if (!response.ok) {
    // 404 = slug not found or not opted-in; 500 = backend not yet live
    return null;
  }

  let raw: unknown;
  try {
    raw = await response.json();
  } catch {
    return null;
  }

  return parseDiscoveryProfile(raw);
}

// Export internal parser for unit-testing without a real HTTP call.
export { parseDiscoveryProfile };
