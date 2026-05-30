/**
 * Type contracts for the public affiliate-marketplace discovery surface.
 *
 * The shape mirrors the `MarketplaceListingV2` model exposed by sibling
 * MARWAN G16 BACKEND (PR #1442 — `src/modules/affiliate-marketplace`).
 *
 * Backend endpoints consumed:
 *   - GET /marketplace/listings           (public, gated on
 *     MARKETPLACE_PUBLIC_DISCOVERY_ENABLED — returns empty page when off)
 *   - GET /marketplace/listings/:slug     (public, 404 when slug unknown
 *     OR listing not in a PUBLISHED-like status)
 *
 * The types are intentionally loose where the backend writeback story
 * is still being shaped (`mediaSnapshot`, `attestationUID`) — the
 * storefront treats them as opaque pass-through fields.
 *
 * Keep the field set in sync with prisma/schema.prisma's
 * `model MarketplaceListingV2` and the discovery service's response.
 */

/**
 * Lifecycle status of a marketplace listing.
 *
 * The storefront only ever sees PUBLISHED-like statuses (LISTED is the
 * legacy pre-PR-#1442 default; PUBLISHED is the new explicit state). The
 * other values are included for completeness and never expected on the
 * discovery surface.
 */
export type IMarketplaceListingStatus =
  | 'LISTED'
  | 'UNLISTED'
  | 'OUT_OF_STOCK'
  | 'DRAFT'
  | 'PUBLISHED'
  | 'SUSPENDED'
  | 'DELISTED';

/**
 * Visibility scope on the marketplace.
 *
 * - PUBLIC       — fully discoverable on /marketplace
 * - PRIVATE_LINK — accessible only via slug (no public listing)
 * - WHITELIST    — only whitelisted agents can see / import
 *
 * The public surface only renders PUBLIC listings.
 */
export type IMarketplaceVisibility =
  | 'PUBLIC'
  | 'PRIVATE_LINK'
  | 'WHITELIST';

/**
 * Minimal merchant snapshot piggy-backed on the listing payload by
 * sibling MARWAN G16 BACKEND's ACP enrichment service. Optional because
 * the upstream may not always populate it (e.g. legacy LISTED rows that
 * pre-date the enrichment writeback).
 */
export interface IMarketplaceListingMerchant {
  merchantId: string;
  shopSlug?: string | null;
  shopName?: string | null;
  shopLogo?: string | null;
  shopBackgroundImage?: string | null;
  shopDescription?: string | null;
}

/**
 * Single marketplace listing as returned by the public discovery
 * endpoints. Field semantics:
 *
 * - `commissionRate`  — percent, validated 1–80 by the backend
 * - `currency`        — ISO 4217 (defaults to USD when missing)
 * - `imageUrls`       — gallery; first entry is treated as the hero
 * - `slug`            — URL-safe slug, allocated at first publish.
 *                       Nullable for legacy LISTED rows that pre-date
 *                       the slug field — those rows are filtered out of
 *                       the discovery surface in the proxy.
 * - `mediaSnapshot`   — frozen media metadata at publish time. Opaque
 *                       to the storefront; reserved for future use.
 * - `attestationUID`  — optional EAS attestation UID (onchain provenance,
 *                       MARWAN multi-chain attestation arch — PR #1441).
 */
export interface IMarketplaceListing {
  id: string;
  droplinkedProductId: string;
  merchantId: string;
  title: string;
  description?: string | null;
  price: number;
  currency: string;
  commissionRate: number;
  status: IMarketplaceListingStatus;
  isInviteOnly?: boolean;
  imageUrls: string[];
  trendingScore?: number;
  importCount?: number;
  conversionCount?: number;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string | null;
  delistedAt?: string | null;
  delistReason?: string | null;
  marketplaceVisibility?: IMarketplaceVisibility;
  affiliateProgramId?: string | null;
  slug?: string | null;
  mediaSnapshot?: unknown;
  attestationUID?: string | null;
  merchant?: IMarketplaceListingMerchant;
}

/**
 * Paginated page envelope from `GET /marketplace/listings`. Cursor is
 * the listing ObjectId of the last item on the prior page (matches the
 * ProductFeedRepository convention).
 */
export interface IMarketplaceListingPage {
  data: IMarketplaceListing[];
  nextCursor: string | null;
  limit: number;
}

/**
 * Filter shape consumed by the discovery proxy. Mirrors the backend
 * `ListFilterDto`. Encoded into URL params via the helpers in
 * `@/lib/marketplace/marketplace`.
 */
export interface IMarketplaceListingFilter {
  q?: string;
  category?: string[];
  priceMin?: number;
  priceMax?: number;
  commissionRateMin?: number;
  region?: string;
  cursor?: string;
  limit?: number;
}

/**
 * Default page size — matches backend DEFAULT_LIMIT in
 * `services/discovery.service.ts`.
 */
export const MARKETPLACE_DEFAULT_LIMIT = 24;
export const MARKETPLACE_MAX_LIMIT = 100;
