/**
 * Section 3 — Why droplinked. 3-column value-prop block.
 *
 * Design-system fidelity revision:
 *   • Renders as dark `Aura Card`-style tiles per Figma Components canvas
 *     43431:342009 + Main Pages 1440 landing value-prop band.
 *   • Mint micro-label per the Section Header vocabulary.
 *   • Inter display headings, ink-muted body.
 */
export default function WhyDroplinked() {
    return (
        <section className="px-6 py-16 sm:py-24 max-w-6xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
                <p className="text-xs uppercase tracking-[0.18em] text-mint font-semibold mb-3">
                    Why droplinked
                </p>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight max-w-3xl mx-auto">
                    The three knobs that matter when you&apos;re leaving legacy networks.
                </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
                <ValueProp
                    icon={<IconPercent />}
                    label="Cost transparency"
                    headline="1.5% platform fee. That's it."
                    body="Stripe processing stays separate (whatever your existing rate is). No setup fees, no minimums, no Net-30. Compare to Impact's 8-15% all-in."
                />
                <ValueProp
                    icon={<IconBolt />}
                    label="Same-day creator payouts"
                    headline="USDC on Base or Stripe Connect."
                    body="Atomic-style payouts at order-confirm. Creators pick their rail at signup. No Net-30, no Net-60, no friction."
                />
                <ValueProp
                    icon={<IconSpark />}
                    label="AI distribution included"
                    headline="Your products show up in ChatGPT, Claude, Perplexity."
                    body="Every droplinked merchant is automatically syndicated to the AI shopping layer via our MCP and Stripe ACP endpoints. First-mover advantage on agentic commerce."
                />
            </div>
        </section>
    );
}

function ValueProp({
    icon,
    label,
    headline,
    body,
}: {
    icon: React.ReactNode;
    label: string;
    headline: string;
    body: string;
}) {
    return (
        <div className="rounded-2xl border border-line-strong bg-surface-1 p-6 sm:p-7 shadow-card-dark hover:border-mint/40 transition-colors duration-200 h-full flex flex-col">
            <div className="w-11 h-11 rounded-xl bg-mint/12 border border-mint/30 flex items-center justify-center text-mint mb-5">
                {icon}
            </div>
            <p className="text-xs uppercase tracking-[0.15em] text-mint font-semibold mb-2">{label}</p>
            <h3 className="text-xl sm:text-2xl font-semibold text-white leading-snug">{headline}</h3>
            <p className="mt-3 text-sm sm:text-base text-ink-muted leading-relaxed flex-1">{body}</p>
        </div>
    );
}

function IconPercent() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden>
            <line x1="19" y1="5" x2="5" y2="19" />
            <circle cx="6.5" cy="6.5" r="2.5" />
            <circle cx="17.5" cy="17.5" r="2.5" />
        </svg>
    );
}

function IconBolt() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden>
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
    );
}

function IconSpark() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden>
            <path d="M12 3v3" />
            <path d="M12 18v3" />
            <path d="M5.6 5.6l2.1 2.1" />
            <path d="M16.3 16.3l2.1 2.1" />
            <path d="M3 12h3" />
            <path d="M18 12h3" />
            <path d="M5.6 18.4l2.1-2.1" />
            <path d="M16.3 7.7l2.1-2.1" />
        </svg>
    );
}
