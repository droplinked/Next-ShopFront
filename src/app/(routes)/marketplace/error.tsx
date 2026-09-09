"use client";

/**
 * Error boundary for /marketplace, /marketplace/<advertiser> and the PDP.
 *
 * Reached when a page throws `UpstreamUnavailableError` (apiv3 429 / 5xx /
 * network). Next answers with a 5xx that it does NOT put in the ISR cache —
 * a failed background revalidation keeps serving the last good page, a
 * failed first render is retried on the next request. Before this boundary
 * existed the same condition was `notFound()`: a real 404, cached for an hour.
 */

import UpstreamUnavailable from "@/components/core/UpstreamUnavailable";

export default function MarketplaceError({ reset }: { error: Error; reset: () => void }) {
  return <UpstreamUnavailable reset={reset} />;
}
