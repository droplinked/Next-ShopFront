"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn/cn";
import { emit } from "./analytics";

interface MirrorResultProps {
    input: { kind: "url" | "csv" | "demo"; value: string };
    onCtaClick: (choice: "program" | "listing" | "talk") => void;
}

/**
 * Live mirror result panel — design-system fidelity revision.
 *
 * Surface vocabulary mirrors Figma `Aura Card` (43431:342009) + the dark
 * landing layered card pattern (Main Pages canvas, Frame 1707492505).
 *
 * Layered surfaces: page bg `#0A0A0A` → card `#141414` → inner row `#1C1C1C`.
 * Mint top-bar uses a 12% fill of `#2BCEA1` with a 30% mint border.
 *
 * Animates a "loading → mirrored" transition then renders:
 *   1. Top bar with shop-mirrored confirmation + counts
 *   2. Verified Brand (pending KYB review) preview card
 *   3. 8-product preview grid (stubbed placeholders for MVP)
 *   4. 3-CTA fork — the actual conversion question
 *   5. Email capture (value-first — AFTER the mirror, not before)
 *
 * TODO: real backend mirror lives in Stream-1 (multi-source feed-ingest
 * workers — separate issue). For Stream-0 MVP this animates a placeholder
 * to validate the UX shape; product images come from picsum to make the
 * grid feel concrete during operator review.
 */
export default function MirrorResult({ input, onCtaClick }: MirrorResultProps) {
    const [phase, setPhase] = useState<"loading" | "ready">("loading");
    const [productCount] = useState(() => 24 + Math.floor(Math.random() * 80));
    const [collectionCount] = useState(() => 3 + Math.floor(Math.random() * 6));

    useEffect(() => {
        const timer = setTimeout(() => {
            setPhase("ready");
            emit({ name: "mirror_complete", productCount });
        }, 2400);
        return () => clearTimeout(timer);
    }, [productCount]);

    return (
        <section className="px-6 py-12 sm:py-16 max-w-6xl mx-auto">
            {phase === "loading" ? (
                <LoadingPanel input={input} />
            ) : (
                <ReadyPanel
                    productCount={productCount}
                    collectionCount={collectionCount}
                    onCtaClick={onCtaClick}
                />
            )}
        </section>
    );
}

function LoadingPanel({ input }: { input: MirrorResultProps["input"] }) {
    const label =
        input.kind === "url"
            ? `Mirroring ${input.value}…`
            : input.kind === "csv"
            ? "Reading your CSV…"
            : "Loading demo shop…";

    return (
        <div className="border border-line-strong rounded-2xl p-8 sm:p-12 bg-surface-1 shadow-card-dark">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-2.5 h-2.5 rounded-full bg-mint animate-pulse shadow-[0_0_12px_rgba(43,206,161,0.7)]" />
                <span className="text-sm font-medium text-ink-soft">{label}</span>
            </div>
            <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden relative">
                <div className="ds-shimmer absolute inset-y-0 left-0 w-2/3 rounded-full" />
            </div>
            <p className="mt-6 text-sm text-ink-muted">
                Detecting platform · Reading product feed · Generating LLMS.txt per product · Preparing
                Verified Brand preview
            </p>
        </div>
    );
}

function ReadyPanel({
    productCount,
    collectionCount,
    onCtaClick,
}: {
    productCount: number;
    collectionCount: number;
    onCtaClick: (c: "program" | "listing" | "talk") => void;
}) {
    return (
        <div className="space-y-10">
            {/* Top bar — mint emphasis card */}
            <div className="border border-mint/40 bg-mint/[0.08] rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-mint-glow">
                <div>
                    <p className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                        <CheckIcon /> Your shop is now mirrored on droplinked
                    </p>
                    <p className="text-sm text-ink-soft/80 mt-1">
                        {productCount} products · {collectionCount} collections · ready for distribution
                    </p>
                </div>
            </div>

            {/* Verified Brand preview card — dark surface, mint badge */}
            <div className="border border-line-strong rounded-2xl p-6 sm:p-8 bg-surface-1 shadow-card-dark">
                <div className="flex items-start gap-4">
                    <div className="shrink-0">
                        <div className="w-12 h-12 rounded-full bg-mint/15 border border-mint/30 flex items-center justify-center animate-pulse">
                            <CheckIcon className="text-mint" />
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-lg sm:text-xl font-semibold text-white">
                                Verified Brand
                            </span>
                            <span className="text-xs px-2.5 py-1 rounded-full bg-surface-3 text-ink-soft font-medium border border-line-strong">
                                pending KYB review
                            </span>
                        </div>
                        <p className="mt-2 text-sm sm:text-base text-ink-muted leading-relaxed">
                            Brands verified on droplinked get prioritized in AI shopping results and earn
                            higher conversion across ChatGPT, Claude, and Perplexity.
                        </p>
                        <button
                            type="button"
                            onClick={() => onCtaClick("listing")}
                            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-mint hover:text-mint-light transition-colors"
                        >
                            Complete verification →{" "}
                            <span className="text-ink-faint font-normal">(takes 5 minutes)</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Product grid preview */}
            <div>
                <p className="text-xs uppercase tracking-[0.15em] text-mint font-semibold mb-3">
                    Preview · first 8 products mirrored
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                    {STUB_PRODUCTS.map((p) => (
                        <ProductCard key={p.id} product={p} />
                    ))}
                </div>
            </div>

            {/* 3-CTA fork */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <CtaCard
                    label="Start your affiliate program"
                    body="Open a same-day-payout affiliate program in 5 minutes. 1.5% flat platform fee, no Net-30."
                    cta="Open program"
                    onClick={() => onCtaClick("program")}
                    accent
                />
                <CtaCard
                    label="Claim your verified listing"
                    body="Get your brand attested onchain so AI buyers cite your products instead of resellers' listings."
                    cta="Claim listing"
                    onClick={() => onCtaClick("listing")}
                />
                <CtaCard
                    label="Talk to a partnerships lead"
                    body="50+ SKUs? Multi-region? Custom partnership terms available."
                    cta="Book 15 min"
                    onClick={() => onCtaClick("talk")}
                />
            </div>

            {/* Email capture */}
            <SaveForLaterCapture />
        </div>
    );
}

function CtaCard({
    label,
    body,
    cta,
    onClick,
    accent = false,
}: {
    label: string;
    body: string;
    cta: string;
    onClick: () => void;
    accent?: boolean;
}) {
    return (
        <div
            className={cn(
                "rounded-2xl p-6 border flex flex-col h-full transition-colors duration-200",
                accent
                    ? "border-mint/40 bg-mint/[0.06] hover:border-mint/60"
                    : "border-line-strong bg-surface-1 hover:border-line-stronger"
            )}
        >
            <h3 className="text-base sm:text-lg font-semibold text-white">{label}</h3>
            <p className="mt-2 text-sm text-ink-muted flex-1 leading-relaxed">{body}</p>
            <button
                type="button"
                onClick={onClick}
                className={cn(
                    "mt-5 px-5 py-3 rounded-xl font-semibold text-sm transition-colors duration-150",
                    accent
                        ? "bg-mint text-surface hover:bg-mint-light shadow-mint-glow"
                        : "border border-line-stronger text-white hover:bg-surface-3 hover:border-mint/50"
                )}
            >
                {cta} →
            </button>
        </div>
    );
}

function SaveForLaterCapture() {
    const [email, setEmail] = useState("");
    const [saved, setSaved] = useState(false);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.includes("@")) return;
        emit({ name: "email_captured", source: "save_for_later" });
        setSaved(true);
    };

    return (
        <div className="border-t border-line-strong pt-8">
            <p className="text-sm text-ink-muted mb-3">
                Want to come back to this later? Drop your email — we&apos;ll send you a private link to
                your mirrored shop.
            </p>
            {saved ? (
                <p className="text-sm text-mint font-medium">
                    Saved. Check your inbox for your private mirror link.
                </p>
            ) : (
                <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2 max-w-md">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@yourbrand.com"
                        className="flex-1 px-4 py-3 rounded-xl border border-line-strong bg-surface-1 text-white outline-none focus:border-mint placeholder:text-ink-faint text-sm"
                        aria-label="Email address"
                    />
                    <button
                        type="submit"
                        className="px-5 py-3 rounded-xl border border-line-stronger text-white font-semibold text-sm hover:bg-surface-3 hover:border-mint/50 transition-colors"
                    >
                        Save my shop
                    </button>
                </form>
            )}
        </div>
    );
}

interface StubProduct {
    id: string;
    title: string;
    price: string;
    image: string;
}

const STUB_PRODUCTS: StubProduct[] = [
    { id: "1", title: "Signature Hoodie", price: "$68", image: "https://picsum.photos/seed/p1/400/400" },
    { id: "2", title: "Travel Mug", price: "$24", image: "https://picsum.photos/seed/p2/400/400" },
    { id: "3", title: "Cotton Tee", price: "$32", image: "https://picsum.photos/seed/p3/400/400" },
    { id: "4", title: "Canvas Tote", price: "$28", image: "https://picsum.photos/seed/p4/400/400" },
    { id: "5", title: "Leather Wallet", price: "$95", image: "https://picsum.photos/seed/p5/400/400" },
    { id: "6", title: "Wool Beanie", price: "$22", image: "https://picsum.photos/seed/p6/400/400" },
    { id: "7", title: "Vinyl Sticker Pack", price: "$8", image: "https://picsum.photos/seed/p7/400/400" },
    { id: "8", title: "Limited Print", price: "$140", image: "https://picsum.photos/seed/p8/400/400" },
];

function ProductCard({ product }: { product: StubProduct }) {
    return (
        <div className="rounded-xl overflow-hidden border border-line-strong bg-surface-1 hover:border-mint/40 transition-colors duration-150">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={product.image}
                alt={product.title}
                className="w-full aspect-square object-cover bg-surface-3"
                loading="lazy"
            />
            <div className="p-3">
                <p className="text-sm font-medium text-white truncate">{product.title}</p>
                <p className="text-xs text-ink-muted mt-1">{product.price}</p>
            </div>
        </div>
    );
}

function CheckIcon({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className={cn("w-5 h-5 text-mint", className)}
            aria-hidden="true"
        >
            <path
                fillRule="evenodd"
                d="M16.704 5.29a1 1 0 010 1.42l-8 8a1 1 0 01-1.42 0l-4-4a1 1 0 011.42-1.42L8 12.58l7.29-7.29a1 1 0 011.414 0z"
                clipRule="evenodd"
            />
        </svg>
    );
}
