/**
 * MarketplaceRegistrationCta — additive "Powered by droplinked" merchant-
 * acquisition band for the curated affiliate PDP.
 *
 * WHY: the marketplace PDP already earns catalogue + shopping-agent traffic but
 * sends every visitor OUT to the retailer ("Buy at {retailer}"). This section
 * makes the same page double as a merchant-acquisition surface — it proves the
 * distribution the viewer is looking at, then invites them to get their OWN
 * catalog listed the same way.
 *
 * HONEST FRAMING (do not regress): this is visually SECONDARY to the retailer
 * buy button (outline, muted band, separated by a divider below the product) and
 * never implies droplinked sells this item. The retailer click-out, the
 * affiliate disclosure, the JSON-LD, and the canonical stay exactly as they are.
 *
 * SSR-SAFE: pure server component (no "use client", no hooks, no browser APIs) —
 * renders identically in the SSR HTML the crawler/agent sees. Flag-gating lives
 * at the call site (page.tsx), mirroring PREMIUM_PDP_ENABLED in
 * ProductExperience.tsx, so this component is a plain presentational unit.
 */

import Link from "next/link";

/**
 * Canonical droplinked merchant signup — the SAME destination the marketing
 * site's "Get Started" / "Connect your store free" / "Sign up for free" CTAs use
 * (droplinked.com/onboarding?entry=signup) — plus marketplace-PDP attribution so
 * signups sourced from these catalogue pages are measurable. `src=marketplace_pdp`
 * matches the convention already on the retailer `/r/` redirect
 * (`?src=marketplace_pdp`); the utm_* pair is the standard campaign attribution.
 */
export const MARKETPLACE_PDP_SIGNUP_URL =
  "https://droplinked.com/onboarding?entry=signup" +
  "&src=marketplace_pdp" +
  "&utm_source=marketplace_pdp" +
  "&utm_medium=catalogue_cta";

export default function MarketplaceRegistrationCta() {
  return (
    <section
      aria-label="Sell your catalog on droplinked"
      data-testid="marketplace-registration-cta"
      className="mt-12 md:mt-16 border-t border-line pt-10"
    >
      <div className="rounded-xl border border-line bg-surface-1/50 p-6 md:p-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2 md:max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-mint-500">
            Powered by droplinked
          </p>
          <h2 className="text-xl md:text-2xl font-semibold text-foreground leading-snug">
            Sell your catalog everywhere buyers and AI agents shop.
          </h2>
          <p className="text-sm text-foreground/60 leading-relaxed">
            This page is a live example of droplinked distribution — a curated
            product made discoverable to shoppers and shopping agents. Bring your
            own catalog and get listed across the agentic web, with same-day
            payouts and a flat platform fee.
          </p>
        </div>

        <div className="shrink-0">
          {/* Outline / secondary style — deliberately quieter than the solid
              mint "Buy at {retailer}" primary above, so it never competes with
              the shopper's purchase path. */}
          <Link
            href={MARKETPLACE_PDP_SIGNUP_URL}
            data-testid="marketplace-registration-cta-link"
            className="inline-flex items-center justify-center rounded-lg border border-mint-500 px-6 py-3 text-base font-semibold text-mint-500 transition-colors hover:bg-mint-500 hover:text-black w-full md:w-auto"
          >
            Connect your store &rarr;
          </Link>
          <p className="mt-2 text-center md:text-right text-xs text-foreground/50">
            Start free · no code
          </p>
        </div>
      </div>
    </section>
  );
}
