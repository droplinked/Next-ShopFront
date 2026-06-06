/**
 * Section 4 — How it works (4-step horizontal flow).
 *
 * Design-system fidelity revision:
 *   • Sub-surface band (`#141414`) per Figma 1440 landing "how it works" row
 *     (alternating surface levels for section rhythm).
 *   • Numbered mint step pills with a connecting hairline on desktop to
 *     read as a stepper, not a 4-tile grid.
 *   • Mobile collapses to vertical stack; step pill stays on the left.
 *
 * Steps echo the affiliate-program pitch: mirror → KYB → launch → settle.
 */
export default function HowItWorks() {
    const steps = [
        {
            n: 1,
            title: "Paste your shop URL or upload your catalog",
            body: "Shopify, Woo, BigCommerce, Magento, or any CSV export from Impact / AWIN / Rakuten.",
        },
        {
            n: 2,
            title: "droplinked mirrors your inventory in 60 seconds",
            body: "Every product gets an LLMS.txt file (AI-readable), an attestation slot, and an MCP endpoint.",
        },
        {
            n: 3,
            title: "You verify your brand",
            body: "5-minute KYB. Your Verified Brand badge goes live across droplinked + the AI search layer.",
        },
        {
            n: 4,
            title: "You launch your affiliate program",
            body: "Set commission %, share your join link. Creators sign up, grab links, drive traffic. You pay 1.5%. Same-day settlement.",
        },
    ];

    return (
        <section className="px-6 py-16 sm:py-24 bg-surface-1 border-y border-line-strong">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12 sm:mb-16">
                    <p className="text-xs uppercase tracking-[0.18em] text-mint font-semibold mb-3">
                        Process
                    </p>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
                        How it works
                    </h2>
                </div>
                <div className="relative">
                    {/* Desktop connector hairline */}
                    <div
                        className="hidden md:block absolute top-5 left-0 right-0 h-px bg-gradient-to-r from-transparent via-mint/30 to-transparent"
                        aria-hidden
                    />
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 sm:gap-6 relative">
                        {steps.map((s) => (
                            <Step key={s.n} n={s.n} title={s.title} body={s.body} />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
    return (
        <div className="relative flex md:block gap-4">
            <div className="shrink-0">
                <div className="w-10 h-10 rounded-full bg-surface-2 border border-mint/40 text-mint font-bold flex items-center justify-center shadow-mint-glow">
                    {n}
                </div>
            </div>
            <div className="md:mt-4">
                <h3 className="text-base sm:text-lg font-semibold text-white leading-snug">{title}</h3>
                <p className="mt-2 text-sm text-ink-muted leading-relaxed">{body}</p>
            </div>
        </div>
    );
}
