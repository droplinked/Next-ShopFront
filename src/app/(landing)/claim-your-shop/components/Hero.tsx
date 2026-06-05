"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn/cn";
import { emit } from "./analytics";

interface HeroProps {
    onMirrorStart: (input: { kind: "url" | "csv" | "demo"; value: string }) => void;
}

/**
 * Hero section.
 *
 * The URL input IS the hero — no big illustration, no carousel. The single
 * dominant field + CTA is the only thing that should compete for attention
 * above the fold.
 *
 * Secondary entries (CSV upload, demo shop) sit below the input as small
 * text links so they don't dilute the primary conversion path.
 *
 * Trust strip on the bottom line — concise single-line proof.
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
        <section className="px-6 py-16 sm:py-24 md:py-32 max-w-5xl mx-auto text-center">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-tight">
                Your catalog, AI-ready in 60 seconds.
            </h1>
            <p className="mt-6 text-base sm:text-lg md:text-xl text-foreground/70 max-w-3xl mx-auto leading-relaxed">
                Paste your shop URL. We&apos;ll mirror your products, verify your brand, and make you
                discoverable across ChatGPT, Claude, Perplexity, and the next generation of AI buyers.
            </p>

            <form
                onSubmit={handleSubmit}
                className={cn(
                    "mt-10 max-w-2xl mx-auto",
                    "flex flex-col sm:flex-row gap-3 sm:gap-2 items-stretch",
                    "p-2 sm:p-2 rounded-lg sm:rounded-full",
                    "border-2 border-foreground/10 bg-white",
                    "shadow-[0_8px_30px_rgba(0,0,0,0.06)]",
                    "focus-within:border-hovered focus-within:shadow-[0_8px_30px_rgba(36,182,133,0.15)]",
                    "transition-all duration-200"
                )}
            >
                <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="your-shop.com or paste your Shopify / Woo / BigCommerce URL"
                    className="flex-1 px-4 py-3 sm:py-4 bg-transparent text-base sm:text-lg outline-none placeholder:text-placeholder min-w-0"
                    aria-label="Shop URL"
                />
                <button
                    type="submit"
                    className={cn(
                        "px-6 sm:px-8 py-3 sm:py-4 rounded-md sm:rounded-full",
                        "bg-hovered text-white font-medium text-base whitespace-nowrap",
                        "hover:bg-pressed active:bg-pressed",
                        "transition-colors duration-150",
                        "disabled:bg-disabled disabled:text-disabled-foreground"
                    )}
                    disabled={!url.trim()}
                >
                    Mirror my catalog →
                </button>
            </form>

            <p className="mt-5 text-sm text-foreground/60">
                Have a product file instead?{" "}
                <button
                    type="button"
                    onClick={handleCsvClick}
                    className="underline hover:text-hovered transition-colors"
                >
                    Upload CSV
                </button>{" "}
                (Shopify, Impact, AWIN, Rakuten exports — anything works) ·{" "}
                <button
                    type="button"
                    onClick={handleDemoClick}
                    className="underline hover:text-hovered transition-colors"
                >
                    Try a demo shop
                </button>
            </p>

            <p className="mt-10 text-xs sm:text-sm text-foreground/50 max-w-3xl mx-auto px-2">
                Connected to Shopify, WooCommerce, BigCommerce, Magento · Trusted by brands across
                multiple countries · Built on EAS attestations on Base + Avalanche
            </p>
        </section>
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
