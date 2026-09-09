/**
 * fetch-upstream.ts — the ONE server-side JSON fetch every SSR loader uses to
 * talk to apiv3, returning a typed OUTCOME instead of a lossy `null`.
 *
 * The classification rule lives in `./upstream-outcome.mjs` (plain ESM so
 * `npm test` can exercise it); this file is the TypeScript seam that applies
 * it to a real `fetch` and never throws.
 *
 * HOW PAGES CONSUME IT
 *   ok           → render
 *   absent       → `notFound()`  (a real, cacheable 404 — the resource is gone)
 *   unavailable  → `throw new UpstreamUnavailableError(...)` — an error
 *                  response Next does NOT put in the ISR cache (a background
 *                  revalidation that throws keeps serving the last good page;
 *                  a first render that throws is a 5xx and is retried on the
 *                  next request), rendered by the nearest `error.tsx`.
 *
 * Next's data cache only ever stores status-200 fetch responses
 * (`next/dist/server/lib/patch-fetch.js`: `res.status === 200 && ...`), so a
 * 429/5xx is never remembered at the fetch layer either — the ONLY thing that
 * cached the throttle was a page calling `notFound()` on it.
 */

import { classifyUpstreamStatus } from "./upstream-outcome.mjs";

export type UpstreamOutcome = "ok" | "absent" | "unavailable";

export type UpstreamResult<T> =
  | { outcome: "ok"; status: number; body: T }
  | { outcome: "absent"; status: number }
  | { outcome: "unavailable"; status: number | null; reason: string };

export type UpstreamFailure = Exclude<UpstreamResult<never>, { outcome: "ok" }>;

/**
 * GET JSON from apiv3. Never throws. The body of a non-2xx response is never
 * parsed (an error envelope is not the resource), and a 2xx whose body is not
 * JSON is `unavailable`, not `absent` — a proxy error page is not "gone".
 */
export async function fetchUpstreamJson(
  url: string,
  init?: RequestInit
): Promise<UpstreamResult<unknown>> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (error) {
    return {
      outcome: "unavailable",
      status: null,
      reason: `network: ${error instanceof Error ? error.message : String(error)}`,
    };
  }

  const outcome = classifyUpstreamStatus(response.status);
  if (outcome === "absent") return { outcome, status: response.status };
  if (outcome === "unavailable") {
    return { outcome, status: response.status, reason: `http ${response.status}` };
  }

  try {
    const body: unknown = await response.json();
    return { outcome: "ok", status: response.status, body };
  } catch {
    return {
      outcome: "unavailable",
      status: response.status,
      reason: "malformed body",
    };
  }
}

/**
 * Thrown by a page when the resource it needs is UNAVAILABLE (throttled,
 * backend down, network). Reaches the segment's `error.tsx` and Sentry —
 * a throttled crawl is now visible as an error, not disguised as a 404.
 */
export class UpstreamUnavailableError extends Error {
  readonly resource: string;
  readonly status: number | null;

  constructor(resource: string, failure: { status: number | null; reason?: string }) {
    super(
      `upstream unavailable for ${resource}: ${failure.reason ?? `http ${failure.status}`}`
    );
    this.name = "UpstreamUnavailableError";
    this.resource = resource;
    this.status = failure.status;
  }
}

/**
 * The one decision every page makes after a loader returns. Centralised so a
 * page cannot forget the `unavailable` branch and fall back to `notFound()`.
 * Returns the value on `ok`; the caller handles `absent` (notFound) itself
 * because `notFound()` must be called from the page's own render scope.
 */
export function throwIfUnavailable<T>(
  resource: string,
  result: UpstreamResult<T>
): asserts result is Exclude<UpstreamResult<T>, { outcome: "unavailable" }> {
  if (result.outcome === "unavailable") {
    throw new UpstreamUnavailableError(resource, result);
  }
}
