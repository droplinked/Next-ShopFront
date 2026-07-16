import { NextResponse } from 'next/server';

/**
 * Same-origin proxy for the public Merchant-of-Record order-confirmation
 * endpoint. Mirrors the `mor-checkout/session` proxy: the aggregate storefront
 * root has no shop identity, so the client cannot call apiv3 directly. This runs
 * SERVER-SIDE and forwards to apiv3's PUBLIC `/mor-checkout/confirmation/:id`.
 *
 * apiv3 returns 404 while the confirming Stripe webhook is still in flight — the
 * status is forwarded verbatim so the `/checkout/success` page can poll briefly.
 */
const APIV3_BASE = (
  process.env.APIV3_BASE_URL || 'https://apiv3.droplinked.com'
).replace(/\/$/, '');

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await params;
    const res = await fetch(
      `${APIV3_BASE}/mor-checkout/confirmation/${encodeURIComponent(sessionId)}`,
      {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      },
    );
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error: unknown) {
    console.error('mor-checkout confirmation proxy error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 },
    );
  }
}
