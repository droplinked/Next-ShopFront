/**
 * Section 3 — Why droplinked. 3-column value-prop block.
 *
 * Columns: cost transparency / same-day payouts / AI distribution included.
 * Per the operator copy spec, these are the three knobs that matter to
 * brands evaluating leaving Impact / AWIN / Rakuten.
 */
export default function WhyDroplinked() {
    return (
        <section className="px-6 py-16 sm:py-24 max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
                <ValueProp
                    label="Cost transparency"
                    headline="1.5% platform fee. That's it."
                    body="Stripe processing stays separate (whatever your existing rate is). No setup fees, no minimums, no Net-30. Compare to Impact's 8-15% all-in."
                />
                <ValueProp
                    label="Same-day creator payouts"
                    headline="USDC on Base or Stripe Connect."
                    body="Atomic-style payouts at order-confirm. Creators pick their rail at signup. No Net-30, no Net-60, no friction."
                />
                <ValueProp
                    label="AI distribution included"
                    headline="Your products show up in ChatGPT, Claude, Perplexity."
                    body="Every droplinked merchant is automatically syndicated to the AI shopping layer via our MCP and Stripe ACP endpoints. First-mover advantage on agentic commerce."
                />
            </div>
        </section>
    );
}

function ValueProp({ label, headline, body }: { label: string; headline: string; body: string }) {
    return (
        <div>
            <p className="text-xs uppercase tracking-wide text-hovered font-semibold mb-3">{label}</p>
            <h3 className="text-xl sm:text-2xl font-semibold text-foreground leading-snug">{headline}</h3>
            <p className="mt-3 text-sm sm:text-base text-foreground/70 leading-relaxed">{body}</p>
        </div>
    );
}
