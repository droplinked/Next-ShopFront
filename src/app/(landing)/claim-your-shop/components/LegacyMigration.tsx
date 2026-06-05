"use client";

/**
 * Section 5 — Built for brands leaving the legacy networks.
 *
 * Operator copy positions droplinked as a parallel program brands can run
 * alongside Impact / AWIN / Rakuten rather than forcing a migration cliff.
 *
 * The Calculate-your-savings CTA is a stub for the ROI calculator — that
 * feature ships in a follow-up issue (out of MVP scope per the issue spec).
 */
export default function LegacyMigration() {
    return (
        <section className="px-6 py-16 sm:py-24 max-w-4xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
                Migrating from Impact, AWIN, or Rakuten?
            </h2>
            <p className="mt-5 text-base sm:text-lg text-foreground/70 leading-relaxed max-w-3xl mx-auto">
                The legacy affiliate network model is collapsing. droplinked is the modern alternative —
                but you don&apos;t have to choose. Run droplinked as your AI-driven channel while keeping
                your existing program live. Most brands start with droplinked as a second program and
                scale up as same-day payouts and lower fees compound.
            </p>
            <button
                type="button"
                onClick={() => {
                    // TODO: link to /roi-calculator route (out of MVP scope, separate issue).
                    // eslint-disable-next-line no-console
                    console.log("[landing] calculator stub clicked");
                }}
                className="mt-8 inline-flex items-center px-6 py-3 rounded-full border-2 border-foreground text-foreground font-medium hover:bg-foreground hover:text-white transition-colors"
            >
                Calculate your savings →
            </button>
        </section>
    );
}
