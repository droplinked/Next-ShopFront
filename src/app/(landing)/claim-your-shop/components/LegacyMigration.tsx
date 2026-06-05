"use client";

/**
 * Section 5 — Built for brands leaving the legacy networks.
 *
 * Design-system fidelity revision:
 *   • Renders as the "footer CTA mint slab" pattern (per Figma 1440 landing
 *     end-of-page CTA) — mint-tinted card with strong border + glow, dense
 *     headline, single primary CTA.
 *   • Calculate-your-savings remains a stub for the ROI calculator (out of
 *     MVP scope per the issue spec).
 */
export default function LegacyMigration() {
    return (
        <section className="px-6 py-16 sm:py-24 max-w-5xl mx-auto">
            <div className="relative rounded-3xl overflow-hidden bg-surface-1 border border-mint/30 shadow-mint-glow-lg">
                {/* Subtle mint glow background */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background:
                            "radial-gradient(80% 80% at 50% 0%, rgba(43,206,161,0.16) 0%, rgba(43,206,161,0) 60%)",
                    }}
                    aria-hidden
                />
                <div className="relative px-6 sm:px-10 py-14 sm:py-20 text-center">
                    <p className="text-xs uppercase tracking-[0.18em] text-mint font-semibold mb-3">
                        Migration-friendly
                    </p>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">
                        Migrating from Impact, AWIN, or Rakuten?
                    </h2>
                    <p className="mt-5 text-base sm:text-lg text-ink-soft/80 leading-relaxed max-w-3xl mx-auto">
                        The legacy affiliate network model is collapsing. droplinked is the modern
                        alternative — but you don&apos;t have to choose. Run droplinked as your AI-driven
                        channel while keeping your existing program live. Most brands start with droplinked
                        as a second program and scale up as same-day payouts and lower fees compound.
                    </p>
                    <button
                        type="button"
                        onClick={() => {
                            // TODO: link to /roi-calculator route (out of MVP scope, separate issue).
                            // eslint-disable-next-line no-console
                            console.log("[landing] calculator stub clicked");
                        }}
                        className="mt-8 inline-flex items-center gap-2 px-7 py-4 rounded-full bg-mint text-surface font-semibold text-base shadow-mint-glow hover:bg-mint-light active:bg-mint-700 transition-colors"
                    >
                        Calculate your savings →
                    </button>
                    <p className="mt-4 text-xs text-ink-faint">
                        Run side-by-side · no migration cliff · keep your existing PSP
                    </p>
                </div>
            </div>
        </section>
    );
}
