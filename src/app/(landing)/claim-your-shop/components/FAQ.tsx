"use client";

/**
 * Section 7 — FAQ. Native <details>/<summary> collapse-expand pattern
 * (matches the existing AppCollapse component aesthetic but keeps each
 * row independent so multiple can be open at once).
 *
 * Design-system fidelity revision:
 *   • Renders as the dark "FAQ Card" pattern per Figma Components canvas
 *     44633:487335 — surface-1 rows with hairline dividers and a mint
 *     focus ring on the active item.
 *   • Plus icon replaced with a rotating chevron, keeping the affordance
 *     visible against the dark surface.
 */
const ITEMS = [
    {
        q: "Do I need to migrate from Shopify?",
        a: "No. droplinked sits next to your existing shop. We mirror your catalog read-only; your store stays exactly where it is.",
    },
    {
        q: "What does the “Verified Brand” badge actually do?",
        a: "AI shopping engines (ChatGPT, Claude, Perplexity) prefer verified merchants when they cite products. The badge is also rendered on your product pages and inside droplinked's MCP responses to agents.",
    },
    {
        q: "What does it cost?",
        a: "1.5% platform fee on attributed sales. Stripe processing (or whatever your existing PSP) is separate and unchanged. No setup, no minimums.",
    },
    {
        q: "How fast do creators get paid?",
        a: "Same-day on USDC. T+3 on Stripe Connect (we cover the float; you don't see it).",
    },
    {
        q: "Do I need a wallet or any crypto knowledge?",
        a: "No. The onchain attestation runs in the background. You see a green checkmark; that's the whole interface.",
    },
    {
        q: "What if my catalog is on WooCommerce / Magento / a custom CMS?",
        a: "Any platform with a public product feed or CSV export works. If you have neither, we'll scrape Schema.org / JSON-LD data from your live shop.",
    },
];

export default function FAQ() {
    return (
        <section className="px-6 py-16 sm:py-24 max-w-3xl mx-auto">
            <div className="text-center mb-10 sm:mb-12">
                <p className="text-xs uppercase tracking-[0.18em] text-mint font-semibold mb-3">
                    Questions
                </p>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
                    Frequently asked
                </h2>
            </div>
            <div className="rounded-2xl border border-line-strong bg-surface-1 divide-y divide-line-strong overflow-hidden">
                {ITEMS.map((item) => (
                    <details
                        key={item.q}
                        className="group open:bg-surface-2 transition-colors"
                    >
                        <summary className="flex items-start justify-between gap-4 cursor-pointer list-none px-5 sm:px-7 py-5">
                            <span className="text-base sm:text-lg font-medium text-white">
                                {item.q}
                            </span>
                            <span
                                className="shrink-0 mt-1 w-6 h-6 rounded-full border border-line-stronger flex items-center justify-center text-mint group-open:bg-mint group-open:text-surface group-open:border-mint transition-colors"
                                aria-hidden
                            >
                                <svg
                                    viewBox="0 0 12 12"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="w-3 h-3 transition-transform duration-200 group-open:rotate-180"
                                >
                                    <polyline points="3 5 6 8 9 5" />
                                </svg>
                            </span>
                        </summary>
                        <p className="px-5 sm:px-7 pb-5 -mt-1 text-sm sm:text-base text-ink-muted leading-relaxed">
                            {item.a}
                        </p>
                    </details>
                ))}
            </div>
        </section>
    );
}
