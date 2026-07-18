import { roboto } from "@/styles/fonts";

export const BASE_API_URL = process.env.NEXT_PUBLIC_BASE_API_URL;
export const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
export const APP_DEVELOPMENT = process.env.NEXT_PUBLIC_APP_DEVELOPMENT === "true";
/**
 * Aggregate product catalog at the platform root (shop.droplinked.com/).
 * Uses a NEXT_PUBLIC_ name so Next INLINES the value at build time — the
 * standalone runner does not carry .env, so a plain (non-public) server var
 * reads as undefined at runtime and the root would wrongly redirect to /home.
 * Defaults OFF by being absent from an environment's ENV_FILE; set
 * NEXT_PUBLIC_ROOT_CATALOG_ENABLED=true to enable (reversible, no code revert).
 */
export const ROOT_CATALOG_ENABLED =
  process.env.NEXT_PUBLIC_ROOT_CATALOG_ENABLED === "true";

/**
 * Merchant-of-Record checkout for the aggregate storefront. When ON, the Buy
 * button on an aggregate PDP routes through the backend `POST /mor-checkout/
 * session` (droplinked's platform Stripe as MoR) → Stripe Checkout, instead of
 * the shop-scoped cart (which the aggregate root has no shop context for).
 * NEXT_PUBLIC_ so Next inlines it at build time. Default OFF — set
 * NEXT_PUBLIC_MOR_CHECKOUT_ENABLED=true to enable (reversible, no code revert).
 */
export const MOR_CHECKOUT_ENABLED =
  process.env.NEXT_PUBLIC_MOR_CHECKOUT_ENABLED === "true";

/**
 * Unified PDP: render the full interactive product body (slider + variant/qty +
 * Buy-now/Mint + description) on the SEO landing page `/<merchant>/product/
 * <slug>` instead of the static price teaser that bounced to `/<productId>`.
 * When ON, the GMC-registered landing URL is transactional in place and shares
 * the same rich media as the interactive route (fixes the sparse structured-
 * data thumbnails). When OFF, the landing page keeps today's static teaser so
 * the GMC landing-page check never regresses.
 * NEXT_PUBLIC_ so Next inlines it at build time (standalone runner carries no
 * .env). Default OFF — set NEXT_PUBLIC_UNIFIED_PDP_ENABLED=true to enable
 * (reversible, no code revert).
 */
export const UNIFIED_PDP_ENABLED =
  process.env.NEXT_PUBLIC_UNIFIED_PDP_ENABLED === "true";

/**
 * Premium PDP: render the Bloomingdale's-grade product body (breadcrumb,
 * thumbnail-rail gallery, size pill grid, detail accordions, POD boilerplate
 * stripped, size charts relocated behind "Size guide") instead of the legacy
 * interactive body. Applies wherever ProductExperience renders (id route +
 * unified slug route). NEXT_PUBLIC_ so Next inlines it at build time. Default
 * OFF — set NEXT_PUBLIC_PREMIUM_PDP_ENABLED=true to enable (reversible, no
 * code revert).
 */
export const PREMIUM_PDP_ENABLED =
  process.env.NEXT_PUBLIC_PREMIUM_PDP_ENABLED === "true";

/**
 * PDP product passport (Phase 1): render the conditional onchain-authenticity
 * module in the premium PDP's reserved authenticity slot (below the CTA). When
 * ON, the module reads the public DPP proof (`GET apiv3/dpp/proof/:gtin`) for
 * the item and renders a quiet badge + passport panel ONLY when a CONFIRMED
 * onchain proof exists (never on pending/simulated); no proof → renders
 * nothing. Read-only, no wallet gate; fail-open (any fetch error → nothing).
 * NEXT_PUBLIC_ so Next inlines it at build time (standalone runner carries no
 * .env). Default OFF — set NEXT_PUBLIC_PDP_PASSPORT_ENABLED=true to enable
 * (reversible, no code revert). See product-passport-platform-strategy-2026-07-16.
 */
export const PDP_PASSPORT_ENABLED =
  process.env.NEXT_PUBLIC_PDP_PASSPORT_ENABLED === "true";

/**
 * Marketplace-PDP registration CTA: render an additive "Powered by droplinked"
 * merchant-acquisition section on the curated affiliate PDP
 * (`/marketplace/<adv>/<item>/<slug>`), below the product and clearly separated
 * from the disclosed "Buy at {retailer}" click-out. It turns the catalogue
 * traffic these pages already earn into droplinked merchant signups (CTA →
 * `droplinked.com/onboarding?entry=signup` with marketplace_pdp attribution).
 * Purely additive: the existing retailer buy-out, JSON-LD, canonical, and
 * affiliate disclosure are untouched, and the CTA never implies droplinked
 * sells the item. NEXT_PUBLIC_ so Next inlines it at build time (standalone
 * runner carries no .env). Default OFF — set
 * NEXT_PUBLIC_MARKETPLACE_PDP_CTA_ENABLED=true to enable (reversible, no code
 * revert).
 */
export const MARKETPLACE_PDP_CTA_ENABLED =
  process.env.NEXT_PUBLIC_MARKETPLACE_PDP_CTA_ENABLED === "true";
export const variantIDs = { color: { _id: "62a989ab1f2c2bbc5b1e7153" }, size: { _id: "62a989e21f2c2bbc5b1e7154" } };
export const app_vertical = "flex flex-col items-center justify-center";
export const app_center = "flex items-center justify-center";
export const app_link = `underline text-link-foreground ${roboto.className}`;
export const hide = {
    below: { sm: "hidden md:block", md: "hidden lg:block", lg: "hidden xl:block", xl: "hidden 2xl:block", "2xl": "hidden 2xl:block" },
    above: { sm: "sm:hidden", md: "md:hidden", lg: "lg:hidden", xl: "xl:hidden", "2xl": "2xl:hidden" },
};
export const link_style = `font-medium text-sm text-[#179EF8] underline`
