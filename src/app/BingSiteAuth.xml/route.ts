/**
 * Bing Webmaster Tools site-verification file — served at /BingSiteAuth.xml.
 *
 * A route handler (not public/) for the same reason as the IndexNow key: the
 * root (routes)/[productId] dynamic catch-all shadows bare public/ files, so
 * public/BingSiteAuth.xml would render the SSR shell and Bing verification would
 * fail. An explicit route segment takes precedence and returns the exact XML.
 */
export const dynamic = "force-static";

const BING_SITE_AUTH = `<?xml version="1.0"?>
<users>
	<user>23995FC2C54A0CB9B1F3DF0CB74676ED</user>
</users>`;

export function GET() {
  return new Response(BING_SITE_AUTH, {
    headers: {
      "content-type": "text/xml; charset=utf-8",
      "cache-control": "public, max-age=86400",
    },
  });
}
