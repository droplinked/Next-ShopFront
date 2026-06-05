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
            <div className="bg-white border-t border-foreground/10 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
                <div className="max-w-5xl mx-auto px-4 py-3 sm:py-4 flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center">
                    <p className="text-xs sm:text-sm font-medium text-foreground hidden sm:block whitespace-nowrap">
                        Ready in 60 seconds. No credit card. No login.
                    </p>
                    <form onSubmit={submit} className="flex gap-2 flex-1 sm:max-w-md sm:ml-auto">
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="paste your shop URL"
                            className="flex-1 px-3 py-2 rounded-md border border-foreground/15 bg-white outline-none focus:border-hovered text-sm"
                            aria-label="Shop URL"
                        />
                        <button
                            type="submit"
                            className="px-4 py-2 rounded-md bg-hovered text-white font-medium text-sm hover:bg-pressed whitespace-nowrap disabled:bg-disabled disabled:text-disabled-foreground"
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
