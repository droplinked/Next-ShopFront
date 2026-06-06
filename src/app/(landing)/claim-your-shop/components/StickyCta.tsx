"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn/cn";

interface StickyCtaProps {
    onMirrorStart: (input: { kind: "url"; value: string }) => void;
    /** Hidden when the mirror result is showing (avoids the input duplicating itself). */
    hidden?: boolean;
}

/**
 * Section 8 — Sticky CTA strip at the bottom of the page.
 *
 * Design-system fidelity revision:
 *   • Dark surface (`#141414`) with mint top hairline + soft top shadow to
 *     read as a glass dock against the surface-0 page background.
 *   • Mint CTA pill — same vocabulary as the hero submit button.
 *
 * Cold-traffic mobile-first behaviour: after the user has scrolled past
 * the hero, a slim bar with the URL paste field stays pinned so they can
 * convert at any point. Hidden once the mirror panel is the visible focus.
 */
export default function StickyCta({ onMirrorStart, hidden = false }: StickyCtaProps) {
    const [url, setUrl] = useState("");
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const onScroll = () => setVisible(window.scrollY > 400);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!url.trim()) return;
        onMirrorStart({ kind: "url", value: url });
    };

    if (hidden) return null;

    return (
        <div
            className={cn(
                "fixed bottom-0 inset-x-0 z-30 transition-transform duration-300",
                visible ? "translate-y-0" : "translate-y-full"
            )}
            aria-hidden={!visible}
        >
            {/* Mint hairline on the very top edge */}
            <div className="h-px bg-gradient-to-r from-transparent via-mint/60 to-transparent" />
            <div className="bg-surface-1/95 backdrop-blur-md border-t border-line-strong shadow-[0_-12px_32px_rgba(0,0,0,0.55)]">
                <div className="max-w-5xl mx-auto px-4 py-3 sm:py-4 flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center">
                    <p className="text-xs sm:text-sm font-medium text-ink-soft hidden sm:flex items-center gap-2 whitespace-nowrap">
                        <span
                            className="w-1.5 h-1.5 rounded-full bg-mint shadow-[0_0_8px_rgba(43,206,161,0.7)]"
                            aria-hidden
                        />
                        Ready in 60 seconds · No credit card · No login
                    </p>
                    <form onSubmit={submit} className="flex gap-2 flex-1 sm:max-w-md sm:ml-auto">
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="paste your shop URL"
                            className="flex-1 px-3.5 py-2.5 rounded-lg border border-line-strong bg-surface-2 text-white outline-none focus:border-mint placeholder:text-ink-faint text-sm"
                            aria-label="Shop URL"
                        />
                        <button
                            type="submit"
                            className="px-4 py-2.5 rounded-lg bg-mint text-surface font-semibold text-sm hover:bg-mint-light whitespace-nowrap disabled:bg-surface-3 disabled:text-ink-faint transition-colors shadow-mint-glow"
                            disabled={!url.trim()}
                        >
                            Mirror →
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
