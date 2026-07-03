/**
 * site.ts — single source of truth for storefront identity, contact, and
 * policy summary rendered across the footer and the legal/policy pages.
 *
 * These values back the customer-facing trust surface (business identity,
 * contact method, return/refund/shipping terms, privacy & terms) that a
 * marketplace landing-page review expects to find on every storefront page.
 * Keeping them in one module guarantees the footer, the policy pages, and
 * the structured metadata stay byte-consistent with each other.
 *
 * Per-merchant overrides (legal name, support email, return window) are a
 * planned backend fast-follow — until a shop supplies its own values these
 * platform defaults render so the trust surface is never empty.
 */

/** Public host the storefront is served on (matches the product-feed link host). */
export const SITE_URL = "https://shop.droplinked.com";

/** Platform brand identity shown as the business behind every storefront. */
export const SITE = {
  /** Brand / trading name shown in the footer and policy pages. */
  name: "droplinked",
  /** Legal/operating entity presented as the business of record. */
  legalName: "droplinked",
  /** One-line description of what the platform is (no placeholder copy). */
  tagline: "Powering the next generation of commerce.",
  description:
    "droplinked is a commerce platform that lets creators and brands sell " +
    "physical and digital products with secure checkout, transparent " +
    "pricing, and verifiable product data.",
  /** Primary customer support channel. */
  supportEmail: "support@droplinked.com",
  /** Corporate marketing site. */
  homepage: "https://droplinked.com",
} as const;

/** Verified, absolute social profile URLs (no protocol-less / dead hrefs). */
export const SOCIAL_LINKS = {
  website: SITE.homepage,
  twitter: "https://x.com/droplinked",
  linkedin: "https://www.linkedin.com/company/droplinked",
  instagram: "https://www.instagram.com/droplinked",
} as const;

/**
 * Concrete policy terms surfaced in the footer summary and expanded on the
 * dedicated policy pages. The exact numbers here MUST match whatever is
 * configured in the merchant-center return/shipping settings.
 */
export const POLICY = {
  /** Return window, in days from delivery. */
  returnWindowDays: 14,
  /** How a refund is issued once a return is received. */
  refundMethod: "original payment method",
  /** How long a refund takes to post after the return is received. */
  refundProcessingDays: "5–10 business days",
  /** Order handling time before a shipment leaves. */
  handlingTimeDays: "1–3 business days",
} as const;

/** Footer / policy navigation targets. Every href resolves to a real route. */
export const POLICY_LINKS = [
  { label: "Shipping Policy", href: "/shipping-policy" },
  { label: "Returns & Refunds", href: "/returns-policy" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Contact Us", href: "/contact" },
] as const;

export const COMPANY_LINKS = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "droplinked.com", href: SITE.homepage },
] as const;
