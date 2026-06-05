"use client";

import { useEffect, useState } from "react";
import Hero from "./components/Hero";
import MirrorResult from "./components/MirrorResult";
import WhyDroplinked from "./components/WhyDroplinked";
import HowItWorks from "./components/HowItWorks";
import LegacyMigration from "./components/LegacyMigration";
import PartnerLogos from "./components/PartnerLogos";
import FAQ from "./components/FAQ";
import StickyCta from "./components/StickyCta";
import { emit } from "./components/analytics";

/**
 * /claim-your-shop — public feed-authorization landing page.
 *
 * Cold-outbound destination for the Impact / AWIN / Rakuten migration
 * campaign. Closes droplinked/Next-ShopFront#80 (Stream 0).
 *
 * Conversion mechanic per operator copy spec:
 *   1. URL paste is the hero (no big hero image competing for attention).
 *   2. Hero collapses into a live "mirror" result panel — value-first.
 *   3. Verified Brand (pending KYB) badge + 3-CTA fork = the conversion Q.
 *   4. Email capture only AFTER the mirror lands (no login wall).
 *
 * Mobile-first: outbound emails get opened on phones, same vertical flow,
 * sticky bottom CTA, single-column. JSON-LD Organization schema embedded
 * for AEO.
 *
 * Out of MVP scope (separate issues / TODOs in code):
 *   - Real backend mirror (Stream-1 feed ingest workers — stubbed here)
 *   - ROI calculator (LegacyMigration CTA is a stub)
 *   - OAuth beyond Shopify (CSV is the fallback for Woo/BC/Magento today)
 */
type MirrorInput = { kind: "url" | "csv" | "demo"; value: string };

export default function ClaimYourShopPage() {
    const [mirror, setMirror] = useState<MirrorInput | null>(null);

    useEffect(() => {
        emit({ name: "landing_view" });
    }, []);

    useEffect(() => {
        if (mirror) {
            // Scroll the mirror panel into view as the hero collapses.
            requestAnimationFrame(() => {
                document.getElementById("mirror-panel")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
            });
        }
    }, [mirror]);

    const handleCtaClick = (choice: "program" | "listing" | "talk") => {
        emit({ name: "cta_clicked", choice });
        // TODO: route to the relevant flow:
        //   program → /onboard/program-builder (Stream-2)
        //   listing → /onboard/kyb-intake (Stream-3)
        //   talk    → Calendly or /partnerships (Stream-4)
        // For Stream-0 MVP we just emit the event so we can measure intent.
    };

    return (
        <main className="bg-background text-foreground min-h-screen overflow-x-hidden">
            <JsonLd />

            {/* Hero collapses once a mirror flow has started */}
            {!mirror && <Hero onMirrorStart={setMirror} />}

            {/* Mirror result panel — animates in once URL/CSV/demo is chosen */}
            {mirror && (
                <div id="mirror-panel">
                    <MirrorResult input={mirror} onCtaClick={handleCtaClick} />
                </div>
            )}

            <WhyDroplinked />
            <HowItWorks />
            <LegacyMigration />
            <PartnerLogos />
            <FAQ />

            {/* Sticky CTA strip — hidden while the mirror panel owns the focus */}
            <StickyCta onMirrorStart={(i) => setMirror(i)} hidden={!!mirror} />

            {/* Spacer so the sticky CTA doesn't sit on top of the FAQ */}
            <div className="h-24" aria-hidden />
        </main>
    );
}

/**
 * JSON-LD Organization schema with additionalType: VerifiedBrandProgram.
 *
 * Embedded inline so AEO crawlers (ChatGPT, Claude, Perplexity, Google's
 * SGE) can parse the brand-verification claim without a separate fetch.
 */
function JsonLd() {
    const ld = {
        "@context": "https://schema.org",
        "@type": "Organization",
        additionalType: "VerifiedBrandProgram",
        name: "droplinked",
        url: "https://droplinked.com/claim-your-shop",
        description:
            "droplinked mirrors merchant catalogs, verifies brands onchain, and distributes products across ChatGPT, Claude, Perplexity, and the next generation of AI buyers. 1.5% flat platform fee. Same-day creator payouts in USDC.",
        sameAs: [
            "https://twitter.com/droplinked",
            "https://linkedin.com/company/droplinked",
        ],
    };
    return (
        <script
            type="application/ld+json"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
        />
    );
}
