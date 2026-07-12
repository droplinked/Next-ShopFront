import { BASE_API_URL } from '@/lib/variables/variables';
import { NextResponse } from 'next/server';

/**
 * Same-origin proxy for the public Merchant-of-Record checkout endpoint.
 *
 * The aggregate storefront root has no shop identity, so the client cannot call
 * apiv3 directly (`fetchInstance` throws without an x-shop-id, and
 * NEXT_PUBLIC_BASE_API_URL is not inlined in the client bundle). This route runs
 * SERVER-SIDE, where BASE_API_URL is set, and forwards to apiv3's PUBLIC
 * `/mor-checkout/session` (no x-shop-id). Mirrors `src/app/api/products/route.ts`.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const base = (BASE_API_URL || '').replace(/\/$/, '');
    const res = await fetch(`${base}/mor-checkout/session`, {
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
