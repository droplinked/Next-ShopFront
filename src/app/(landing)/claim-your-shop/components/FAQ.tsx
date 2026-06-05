"use client";

/**
 * Section 7 — FAQ. Native <details>/<summary> collapse-expand pattern
 * (matches the existing AppCollapse component aesthetic but keeps each
 * row independent so multiple can be open at once).
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
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground text-center mb-10">
                Frequently asked
            </h2>
            <div className="divide-y divide-foreground/10 border-y border-foreground/10">
                {ITEMS.map((item) => (
                    <details key={item.q} className="group py-5">
                        <summary className="flex items-start justify-between gap-4 cursor-pointer list-none">
                            <span className="text-base sm:text-lg font-medium text-foreground">
                                {item.q}
                            </span>
                            <span className="shrink-0 mt-1 w-5 h-5 relative">
                                <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-foreground" />
                                <span className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-foreground transition-transform duration-200 group-open:rotate-90 group-open:scale-0" />
                            </span>
                        </summary>
                        <p className="mt-3 text-sm sm:text-base text-foreground/70 leading-relaxed">
                            {item.a}
                        </p>
                    </details>
                ))}
            </div>
        </section>
    );
}
