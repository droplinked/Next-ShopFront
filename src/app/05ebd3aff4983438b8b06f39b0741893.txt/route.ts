/**
 * IndexNow key verification file — served at
 * /05ebd3aff4983438b8b06f39b0741893.txt as text/plain.
 *
 * A route handler (not public/) because the root `(routes)/[productId]`
 * dynamic catch-all intercepts bare `/<name>.txt` paths before Next's public/
 * static files are served on this deployment — so public/<key>.txt rendered the
 * SSR shell (soft-200) and IndexNow could not verify it. An explicit route
 * segment takes precedence over the dynamic catch-all, guaranteeing the raw key.
 *
 * IndexNow requires this to return EXACTLY the key (no markup, no trailing
 * newline). Mirrors robots.ts / sitemap.ts (route-generated SEO artifacts).
 */
export const dynamic = "force-static";

const INDEXNOW_KEY = "05ebd3aff4983438b8b06f39b0741893";

export function GET() {
  return new Response(INDEXNOW_KEY, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=86400",
    },
  });
}
