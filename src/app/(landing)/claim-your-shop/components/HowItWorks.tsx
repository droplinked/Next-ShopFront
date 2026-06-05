/**
 * Section 4 — How it works (4-step horizontal flow).
 *
 * Reads as a numbered horizontal track on desktop, stacks vertically on
 * mobile. Each step echoes a piece of the affiliate-program pitch:
 * mirror → KYB → launch → settle.
 */
export default function HowItWorks() {
    return (
        <section className="px-6 py-16 sm:py-24 bg-foreground/[0.02]">
            <div className="max-w-6xl mx-auto">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground text-center mb-12">
                    How it works
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 sm:gap-4">
                    <Step
                        n={1}
                        title="Paste your shop URL or upload your catalog"
                        body="Shopify, Woo, BigCommerce, Magento, or any CSV export from Impact / AWIN / Rakuten."
                    />
                    <Step
                        n={2}
                        title="droplinked mirrors your inventory in 60 seconds"
                        body="Every product gets an LLMS.txt file (AI-readable), an attestation slot, and an MCP endpoint."
                    />
                    <Step
                        n={3}
                        title="You verify your brand"
                        body="5-minute KYB. Your Verified Brand badge goes live across droplinked + the AI search layer."
                    />
                    <Step
                        n={4}
                        title="You launch your affiliate program"
                        body="Set commission %, share your join link. Creators sign up, grab links, drive traffic. You pay 1.5%. Same-day settlement."
                    />
                </div>
            </div>
        </section>
    );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
    return (
        <div className="relative">
            <div className="w-10 h-10 rounded-full bg-hovered text-white font-semibold flex items-center justify-center mb-4">
                {n}
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground leading-snug">{title}</h3>
            <p className="mt-2 text-sm text-foreground/70 leading-relaxed">{body}</p>
        </div>
    );
}
