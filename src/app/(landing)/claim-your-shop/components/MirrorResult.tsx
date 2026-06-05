"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn/cn";
import { emit } from "./analytics";

interface MirrorResultProps {
    input: { kind: "url" | "csv" | "demo"; value: string };
    onCtaClick: (choice: "program" | "listing" | "talk") => void;
}

/**
 * Live mirror result panel.
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
        <div className="border border-foreground/10 rounded-xl p-8 sm:p-12 bg-white shadow-sm">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 rounded-full bg-hovered animate-pulse" />
                <span className="text-sm font-medium text-foreground/80">{label}</span>
            </div>
            <div className="h-2 bg-foreground/5 rounded-full overflow-hidden">
                <div className="h-full bg-hovered animate-[shimmer_2s_ease-in-out_infinite] w-1/2" />
            </div>
            <p className="mt-6 text-sm text-foreground/60">
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
            {/* Top bar */}
            <div className="border border-hovered/30 bg-hovered/5 rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <p className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
                        <CheckIcon /> Your shop is now mirrored on droplinked
                    </p>
                    <p className="text-sm text-foreground/70 mt-1">
                        {productCount} products · {collectionCount} collections · ready for distribution
                    </p>
                </div>
            </div>

            {/* Verified Brand preview card */}
            <div className="border border-foreground/10 rounded-xl p-6 sm:p-8 bg-white shadow-sm">
                <div className="flex items-start gap-4">
                    <div className="shrink-0">
                        <div className="w-12 h-12 rounded-full bg-hovered/15 flex items-center justify-center animate-pulse">
                            <CheckIcon className="text-hovered" />
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-lg sm:text-xl font-semibold text-foreground">
                                Verified Brand
                            </span>
                            <span className="text-xs px-2 py-1 rounded-full bg-foreground/5 text-foreground/60 font-medium">
                                pending KYB review
                            </span>
                        </div>
                        <p className="mt-2 text-sm sm:text-base text-foreground/70">
                            Brands verified on droplinked get prioritized in AI shopping results and earn
                            higher conversion across ChatGPT, Claude, and Perplexity.
                        </p>
                        <button
                            type="button"
                            onClick={() => onCtaClick("listing")}
                            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-hovered hover:text-pressed transition-colors"
                        >
                            Complete verification →{" "}
                            <span className="text-foreground/50 font-normal">(takes 5 minutes)</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Product grid preview */}
            <div>
                <p className="text-xs uppercase tracking-wide text-foreground/50 mb-3">
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
                "rounded-xl p-6 border flex flex-col h-full",
                accent
                    ? "border-hovered/40 bg-hovered/5"
                    : "border-foreground/10 bg-white"
            )}
        >
            <h3 className="text-base sm:text-lg font-semibold text-foreground">{label}</h3>
            <p className="mt-2 text-sm text-foreground/70 flex-1">{body}</p>
            <button
                type="button"
                onClick={onClick}
                className={cn(
                    "mt-5 px-5 py-3 rounded-md font-medium text-sm transition-colors",
                    accent
                        ? "bg-hovered text-white hover:bg-pressed"
                        : "border border-foreground text-foreground hover:bg-foreground hover:text-white"
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
        <div className="border-t border-foreground/10 pt-8">
            <p className="text-sm text-foreground/70 mb-3">
                Want to come back to this later? Drop your email — we&apos;ll send you a private link to
                your mirrored shop.
            </p>
            {saved ? (
                <p className="text-sm text-hovered font-medium">
                    Saved. Check your inbox for your private mirror link.
                </p>
            ) : (
                <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2 max-w-md">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@yourbrand.com"
                        className="flex-1 px-4 py-3 rounded-md border border-foreground/15 bg-white outline-none focus:border-hovered text-sm"
                        aria-label="Email address"
                    />
                    <button
                        type="submit"
                        className="px-5 py-3 rounded-md border border-foreground text-foreground font-medium text-sm hover:bg-foreground hover:text-white transition-colors"
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
        <div className="rounded-lg overflow-hidden border border-foreground/10 bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={product.image}
                alt={product.title}
                className="w-full aspect-square object-cover bg-foreground/5"
                loading="lazy"
            />
            <div className="p-3">
                <p className="text-sm font-medium text-foreground truncate">{product.title}</p>
                <p className="text-xs text-foreground/60 mt-1">{product.price}</p>
            </div>
        </div>
    );
}

function CheckIcon({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className={cn("w-5 h-5 text-hovered", className)}
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
