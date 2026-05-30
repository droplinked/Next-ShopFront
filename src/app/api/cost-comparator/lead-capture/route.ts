import { NextResponse } from 'next/server';
import { BASE_API_URL } from '@/lib/variables/variables';

/**
 * Proxy for `POST /cost-comparator/lead-capture` on droplinked-backend
 * (PR #1450). Marketing-surface endpoint — public, rate-limited 10/min
 * upstream. NO `x-shop-id` header (defecting merchant has no shop yet).
 *
 * The backend re-computes savings server-side from `calcInput`, so we
 * intentionally do NOT trust any client-supplied savings figure here.
 * If a future variant adds one, drop it before forwarding.
 */
export async function POST(request: Request) {
  if (!BASE_API_URL) {
    return NextResponse.json(
      { error: 'Cost comparator backend URL not configured.' },
      { status: 500 },
    );
  }

  try {
    const body = await request.json();
    const forwardedFor =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      '';

    const upstream = await fetch(
      `${BASE_API_URL}cost-comparator/lead-capture`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(forwardedFor ? { 'x-forwarded-for': forwardedFor } : {}),
        },
        body: JSON.stringify(body),
        cache: 'no-store',
      },
    );

    const text = await upstream.text();
    if (!upstream.ok) {
      return NextResponse.json(
        { error: text || `Lead capture failed (${upstream.status})` },
        { status: upstream.status },
      );
    }
    return new NextResponse(text, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Cost-comparator lead-capture proxy error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Internal Server Error',
      },
      { status: 500 },
    );
  }
}
