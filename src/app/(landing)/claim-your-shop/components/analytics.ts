"use client";

/**
 * Stub analytics emitter for the feed-auth landing funnel.
 *
 * The operator copy spec defines these events:
 *   - landing_view
 *   - url_pasted (value: domain)
 *   - csv_uploaded (value: detected platform / schema)
 *   - mirror_complete (value: product count)
 *   - cta_clicked (value: program | listing | talk)
 *   - email_captured (value: source = save_for_later | gated_program | gated_listing)
 *
 * TODO: wire to the project-wide analytics dispatcher (Segment / Mixpanel /
 * PostHog — whichever the platform standardises on). For Stream-0 MVP this
 * emits to console + dataLayer so we can verify the funnel emits without
 * blocking on the analytics-vendor decision.
 */
export type LandingEvent =
    | { name: "landing_view" }
    | { name: "url_pasted"; domain: string }
    | { name: "csv_uploaded"; schema: string }
    | { name: "mirror_complete"; productCount: number }
    | { name: "cta_clicked"; choice: "program" | "listing" | "talk" }
    | { name: "email_captured"; source: "save_for_later" | "gated_program" | "gated_listing" };

export function emit(event: LandingEvent) {
    if (typeof window === "undefined") return;
    // eslint-disable-next-line no-console
    console.log("[landing.analytics]", event);
    const dataLayer = (window as unknown as { dataLayer?: unknown[] }).dataLayer;
    if (Array.isArray(dataLayer)) {
        dataLayer.push({ event: event.name, ...event });
    }
}
