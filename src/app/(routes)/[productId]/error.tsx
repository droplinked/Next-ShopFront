"use client";

/**
 * Error boundary for /<productId>, /<shop> and /<shop>/product/<slug>.
 *
 * Reached when a page throws `UpstreamUnavailableError` (apiv3 429 / 5xx /
 * network). Next answers with a 5xx — "temporary, retry" to a crawler —
 * instead of the `notFound()` these routes used to answer for the same
 * condition, which read as "gone".
 */

import UpstreamUnavailable from "@/components/core/UpstreamUnavailable";

export default function OneSegmentError({ reset }: { error: Error; reset: () => void }) {
  return <UpstreamUnavailable reset={reset} />;
}
