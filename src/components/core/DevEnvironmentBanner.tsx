"use client";

import { BASE_API_URL } from "@/lib/variables/variables";

/**
 * Renders a persistent, non-dismissable banner when the app is pointed
 * at the DEV API (apiv3dev). Hidden in all other environments.
 *
 * Part of DEV-tightening cleanup 2026-05-19 — landed now that real DEV
 * cluster isolation is in place.
 */
export default function DevEnvironmentBanner() {
    const apiBase = BASE_API_URL || "";
    if (!apiBase.includes("apiv3dev")) return null;

    return (
        <div
            data-testid="dev-environment-banner"
            role="status"
            aria-live="polite"
            style={{
                position: "sticky",
                top: 0,
                left: 0,
                right: 0,
                zIndex: 9999,
                width: "100%",
                backgroundColor: "#FFEB3B",
                color: "#000000",
                textAlign: "center",
                padding: "6px 12px",
                fontSize: "13px",
                fontWeight: 600,
                lineHeight: 1.3,
                fontFamily: "system-ui, -apple-system, sans-serif",
                borderBottom: "1px solid #000000",
            }}
        >
            ⚠️ DEV ENVIRONMENT — data is sanitized, not real
        </div>
    );
}
