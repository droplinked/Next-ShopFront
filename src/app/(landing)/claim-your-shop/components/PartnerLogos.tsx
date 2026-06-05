/**
 * Section 6 — Partner logo grid.
 *
 * Operator copy: single-row gray text wordmarks of the partner ecosystem.
 * Once real SVG logos are dropped in (operator says "add 6-10 customer
 * logos when ready"), swap the text wordmarks for proper logo images.
 *
 * Kept as text wordmarks for the MVP so the section visually reads as the
 * right shape even before logo assets land.
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
        <section className="px-6 py-16 sm:py-20 bg-foreground/[0.02]">
            <div className="max-w-6xl mx-auto text-center">
                <p className="text-sm text-foreground/60 uppercase tracking-wide mb-8">
                    Powered by the partnerships that already underwrite onchain commerce.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 sm:gap-x-12">
                    {PARTNERS.map((p) => (
                        <span
                            key={p}
                            className="text-lg sm:text-xl font-semibold text-foreground/40 hover:text-foreground/70 transition-colors"
                        >
                            {p}
                        </span>
                    ))}
                </div>
            </div>
        </section>
    );
}
