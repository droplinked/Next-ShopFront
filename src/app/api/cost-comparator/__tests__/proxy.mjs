/**
 * Pure JS twin of the proxy logic in
 *   src/app/api/cost-comparator/calculate/route.ts
 *   src/app/api/cost-comparator/lead-capture/route.ts
 *
 * Re-implements the same forwarding contract:
 *  - require BASE_API_URL or 500
 *  - forward x-forwarded-for if present
 *  - relay 4xx/5xx with the upstream body wrapped in `{ error: ... }`
 *
 * The route.ts files use NextResponse / Web Fetch. Here we return a
 * plain `{ status, body }` so the test doesn't need the Next runtime.
 *
 * Keep in lockstep with the TS sources.
 */

export async function proxyPost({
  upstreamUrl,
  baseApiUrl,
  body,
  forwardedFor,
  fetchImpl,
}) {
  if (!baseApiUrl) {
    return {
      status: 500,
      body: { error: 'Cost comparator backend URL not configured.' },
    };
  }
  try {
    const upstream = await fetchImpl(`${baseApiUrl}${upstreamUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(forwardedFor ? { 'x-forwarded-for': forwardedFor } : {}),
      },
      body: JSON.stringify(body),
    });
    const text = await upstream.text();
    if (!upstream.ok) {
      return {
        status: upstream.status,
        body: { error: text || `Request failed (${upstream.status})` },
      };
    }
    return { status: 200, body: tryParseJson(text) };
  } catch (err) {
    return {
      status: 500,
      body: { error: err?.message ?? 'Internal Server Error' },
    };
  }
}

function tryParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}
