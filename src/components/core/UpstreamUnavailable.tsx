"use client";

/**
 * UpstreamUnavailable — the ONE body every route-segment `error.tsx` renders
 * when a page threw `UpstreamUnavailableError` (apiv3 throttled / down /
 * unreachable) instead of pretending the resource does not exist.
 *
 * Deliberately says "temporarily", never "not found": the HTTP status is a
 * 5xx (Next sets it for a server-render throw), which a crawler reads as
 * "retry later" and never records as "gone". `noindex` is belt-and-braces
 * for the streamed case where a 200 shell already left the server.
 */

import Link from "next/link";

interface UpstreamUnavailableProps {
  /** Next's error-boundary `reset` — re-renders the segment (a retry). */
  reset: () => void;
}

export default function UpstreamUnavailable({ reset }: UpstreamUnavailableProps) {
  return (
    <>
      <meta name="robots" content="noindex" />
      <main
        className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center"
        aria-label="Temporarily unavailable"
        data-testid="upstream-unavailable"
      >
        <h1 className="text-xl font-semibold text-foreground mb-2">
          This page is temporarily unavailable
        </h1>
        <p className="text-sm text-foreground/60 max-w-sm mb-8">
          We could not load it just now. Please try again in a moment.
        </p>
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => reset()}
            className="text-sm font-medium text-mint-500 hover:text-mint-400 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="text-sm font-medium text-foreground/60 hover:text-foreground transition-colors"
          >
            Back to home
          </Link>
        </div>
      </main>
    </>
  );
}
