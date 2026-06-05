/**
 * Section 6 — Partner / ecosystem logo grid.
 *
 * Design-system fidelity revision:
 *   • Matches the "ECOSYSTEM PARTNERS" band on the Figma 1440 landing
 *     (Main Pages canvas 43599:488279 — uppercase mint micro-label,
 *     muted ink wordmarks, divider hairlines top and bottom).
 *   • Wordmarks stay as text for the MVP so the section reads as the right
 *     shape even before SVG logo assets land. Swap each `<span>` for a logo
 *     `<Image>` once operator drops the SVG bundle in.
 */
const PARTNERS = [
    "Stripe",
    "PayPal",
    "PYUSD",
    "Telr",
    "Bonum",
    "Paymob",
    "Stord",
    "Quiqup",
    "Shorages",
    "Base",
    "Avalanche",
    "EAS",
];

export default function PartnerLogos() {
    return (
        <section className="px-6 py-16 sm:py-20">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-10">
                    <p className="text-xs uppercase tracking-[0.22em] text-mint font-semibold">
                        Ecosystem partners
                    </p>
                    <p className="mt-3 text-sm sm:text-base text-ink-muted max-w-2xl mx-auto">
                        Powered by the partnerships that already underwrite modern commerce.
                    </p>
                </div>
                <div className="border-y border-line-strong py-8 sm:py-10">
                    <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 sm:gap-x-12">
                        {PARTNERS.map((p) => (
                            <span
                                key={p}
                                className="text-lg sm:text-xl font-semibold text-ink-faint hover:text-ink-soft transition-colors"
                            >
                                {p}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
