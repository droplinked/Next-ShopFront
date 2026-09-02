import { NextResponse } from 'next/server';
import { BUILD_INFO } from '@/lib/build-info.mjs';

/**
 * `GET /api/health` — liveness + build identity for shop.droplinked.com.
 *
 * WHY A ROUTE HANDLER AND NOT SOMETHING ELSE
 * ------------------------------------------
 * This is an SSR Next.js app, so the cheapest honest surface is an App-Router
 * route handler: no page, no layout, no client bundle, no React render. There
 * was no existing health endpoint to extend — `/api/health` and `/api/healthz`
 * both returned 404 on prod before this change — so this adds one rather than
 * a second.
 *
 * The shape mirrors apiv3's `GET /health` (droplinked-backend #3705 / #3709)
 * so a single probe script works against both hosts:
 *
 *   {"status":"ok","timestamp":"…","commit":"01eb6e2ba","builtAt":"…"}
 *   curl -s https://shop.droplinked.com/api/health | jq -r .commit
 *
 * CONTRACT
 * --------
 * - Cheap: no DB, no network, no filesystem, no `await`. `BUILD_INFO` is a
 *   frozen object resolved once when this module is first evaluated.
 * - Unauthenticated: a commit SHA is not sensitive, and gating the probe would
 *   defeat the point.
 * - Fail-soft: `src/lib/build-info.mjs` is total. An image built without the
 *   build args reports `"commit":"unknown"` and still answers `status: "ok"`.
 *   Nothing on this path can throw.
 *
 * `force-dynamic` + `no-store` keep `timestamp` honest: without them Next could
 * serve a prerendered body, so the endpoint would report a moment in the past
 * as if it were now — a liveness probe that cannot go stale is the whole
 * point.
 */

/** Node runtime: `process.env` is read at request time, not inlined. */
export const runtime = 'nodejs';

/** Never prerendered, never revalidated — evaluated per request. */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      commit: BUILD_INFO.commit,
      builtAt: BUILD_INFO.builtAt,
    },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}
