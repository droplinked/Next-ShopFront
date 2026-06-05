"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn/cn";
import { emit } from "./analytics";

interface HeroProps {
    onMirrorStart: (input: { kind: "url" | "csv" | "demo"; value: string }) => void;
}

/**
 * Hero section — design-system fidelity revision.
 *
 * Sources of truth from Figma:
 *   • Page background `#0A0A0A` per Main Pages canvas 43599:488279 (1440
 *     Landing fill rgb(9.5,9.5,9.5)).
 *   • Mint accent `#2BCEA1` / `#49CFAC` hover / `#188367` pressed per
 *     Components canvas 41345:30038 color system.
 *   • Hero radial mint glow + dense gradient halo behind primary CTA.
 *   • Inter display face, hero h1 leans on 56-64px / 700 weight per the
 *     Figma 1440 hero (`Frame 1707518791` ~ 856px display width).
 *
 * UX contract is unchanged: URL paste IS the hero, secondary entries
 * (CSV / demo) read as small links underneath. Trust strip lives at the
 * very bottom of the section.
 */
export default function Hero({ onMirrorStart }: HeroProps) {
    const [url, setUrl] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!url.trim()) return;
        const domain = extractDomain(url);
        emit({ name: "url_pasted", domain });
        onMirrorStart({ kind: "url", value: url });
    };

    const handleCsvClick = () => {
        // TODO: wire CSV upload. For Stream-0 MVP, click triggers the same
        // mirror flow with a stub schema. Real upload + parsing lands in
        // Stream-1 (backend feed ingest).
        emit({ name: "csv_uploaded", schema: "stub" });
        onMirrorStart({ kind: "csv", value: "stub.csv" });
    };

    const handleDemoClick = () => {
        onMirrorStart({ kind: "demo", value: "demo-shop" });
    };

    return (
        <section className="relative overflow-hidden">
            {/* Radial mint glow halo — matches Figma hero background spec */}
            <div
                className="ds-hero-glow absolute inset-0 pointer-events-none"
                aria-hidden
            />
            <div className="relative px-6 py-20 sm:py-28 md:py-36 max-w-5xl mx-auto text-center">
                <p className="text-xs sm:text-sm uppercase tracking-[0.18em] text-mint font-semibold mb-5">
                    droplinked · brand mirror
                </p>
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.05]">
                    Your catalog,{" "}
                    <span className="bg-gradient-to-r from-mint via-mint-light to-mint-neon bg-clip-text text-transparent">
                        AI-ready
                    </span>{" "}
                    in 60 seconds.
                </h1>
                <p className="mt-7 text-base sm:text-lg md:text-xl text-ink-soft/80 max-w-3xl mx-auto leading-relaxed">
                    Paste your shop URL. We&apos;ll mirror your products, verify your brand, and make you
                    discoverable across ChatGPT, Claude, Perplexity, and the next generation of AI buyers.
                </p>

                <form
                    onSubmit={handleSubmit}
                    className={cn(
                        "mt-10 max-w-2xl mx-auto",
                        "flex flex-col sm:flex-row gap-3 sm:gap-2 items-stretch",
                        "p-2 rounded-2xl sm:rounded-full",
                        "border border-line-strong bg-surface-1",
                        "shadow-card-dark",
                        "focus-within:border-mint focus-within:shadow-mint-glow",
                        "transition-all duration-200"
                    )}
                >
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="your-shop.com or paste your Shopify / Woo / BigCommerce URL"
                        className={cn(
                            "flex-1 px-4 sm:px-5 py-3 sm:py-4 bg-transparent text-base sm:text-lg",
                            "text-white outline-none placeholder:text-ink-faint min-w-0"
                        )}
                        aria-label="Shop URL"
                    />
                    <button
                        type="submit"
                        className={cn(
                            "px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-full",
                            "bg-mint text-surface font-semibold text-base whitespace-nowrap",
                            "hover:bg-mint-light active:bg-mint-700",
                            "transition-colors duration-150",
                            "disabled:bg-surface-3 disabled:text-ink-faint",
                            "shadow-mint-glow"
                        )}
                        disabled={!url.trim()}
                    >
                        Mirror my catalog →
                    </button>
                </form>

                <p className="mt-5 text-sm text-ink-muted">
                    Have a product file instead?{" "}
                    <button
                        type="button"
                        onClick={handleCsvClick}
                        className="underline underline-offset-4 decoration-mint/40 text-ink-soft hover:text-mint transition-colors"
                    >
                        Upload CSV
                    </button>{" "}
                    (Shopify, Impact, AWIN, Rakuten exports — anything works) ·{" "}
                    <button
                        type="button"
                        onClick={handleDemoClick}
                        className="underline underline-offset-4 decoration-mint/40 text-ink-soft hover:text-mint transition-colors"
                    >
                        Try a demo shop
                    </button>
                </p>

                <div className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs sm:text-sm text-ink-muted/80 max-w-3xl mx-auto px-2">
                    <span className="inline-flex items-center gap-1.5">
                        <DotMint /> Connected to Shopify, Woo, BigCommerce, Magento
                    </span>
                    <span className="text-ink-faint/60">·</span>
                    <span>Trusted by brands across multiple countries</span>
                    <span className="text-ink-faint/60">·</span>
                    <span>Built on EAS attestations on Base + Avalanche</span>
                </div>
            </div>
        </section>
    );
}

function DotMint() {
    return (
        <span
            className="w-1.5 h-1.5 rounded-full bg-mint shadow-[0_0_8px_rgba(43,206,161,0.7)]"
            aria-hidden
        />
    );
}

function extractDomain(url: string): string {
    try {
        const withProtocol = url.startsWith("http") ? url : `https://${url}`;
        return new URL(withProtocol).hostname;
    } catch {
        return url;
    }
}
