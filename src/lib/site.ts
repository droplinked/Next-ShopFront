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
    "droplinked is the commerce platform for modern brands — sell physical " +
    "and digital products, get found by AI shopping agents and affiliates, " +
    "and get paid through providers you already trust.",
  /** Primary customer support channel. */
  supportEmail: "support@droplinked.com",
  /** Customer-service phone (matches Merchant Center → Business info contact). */
  supportPhone: "+1 (929) 266-7624",
  /**
   * Registered business address of the platform (business of record).
   * MUST match the address configured in Merchant Center → Business info so
   * the storefront the reviewer visits shows the same identity Google holds.
   */
  address: {
    line1: "555 West 5th St",
    city: "Los Angeles",
    region: "California",
    postalCode: "90013",
    country: "United States",
  },
  /** Corporate marketing site. */
  homepage: "https://droplinked.com",
} as const;

/** One-line, human-readable rendering of {@link SITE.address}. */
export const SITE_ADDRESS_LINE = `${SITE.address.line1}, ${SITE.address.city}, ${SITE.address.region} ${SITE.address.postalCode}, ${SITE.address.country}`;

/** `tel:` href derived from {@link SITE.supportPhone} (digits + leading +). */
export const SITE_PHONE_TEL = `tel:${SITE.supportPhone.replace(/[^+\d]/g, "")}`;

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

/**
 * Made-to-order (print-on-demand) terms. POD items are produced per order by
 * the print partner (Printful), so they piggyback Printful's return terms
 * instead of the standard {@link POLICY} return window: no returns for size
 * changes or change of mind; damaged, misprinted, or defective items are
 * replaced or refunded when reported within {@link POD_POLICY.claimWindowDays}
 * days of delivery. Source: Printful Return Policy
 * (https://www.printful.com/policies/returns, last updated 2022-06-03) —
 * "Any claims for misprinted/damaged/defective items must be submitted within
 * 30 days after the product has been received." EU nuance: per Article 16(c)
 * of Directive 2011/83/EU the 14-day right of withdrawal may not be provided
 * for goods made to the consumer's specifications or clearly personalized.
 */
export const POD_POLICY = {
  /** Damaged / misprinted / defective claim window, in days from delivery. */
  claimWindowDays: 30,
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
