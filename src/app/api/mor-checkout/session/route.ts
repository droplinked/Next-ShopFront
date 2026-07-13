import { NextResponse } from 'next/server';

/**
 * Same-origin proxy for the public Merchant-of-Record checkout endpoint.
 *
 * The aggregate storefront root has no shop identity, so the client cannot call
 * apiv3 directly (`fetchInstance` throws without an x-shop-id). This route runs
 * SERVER-SIDE and forwards to apiv3's PUBLIC `/mor-checkout/session` (no
 * x-shop-id). Uses the SAME apiv3 base as the working SSR product loader
 * (`[productId]/lib/product-data.ts`): `APIV3_BASE_URL` env, defaulting to the
 * prod host. (`NEXT_PUBLIC_BASE_API_URL` is intentionally unset here.)
 */
const APIV3_BASE = (
  process.env.APIV3_BASE_URL || 'https://apiv3.droplinked.com'
).replace(/\/$/, '');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await fetch(`${APIV3_BASE}/mor-checkout/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error: unknown) {
    console.error('mor-checkout proxy error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 },
    );
  }
}
