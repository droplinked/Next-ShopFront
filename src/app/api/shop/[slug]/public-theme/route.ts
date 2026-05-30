/**
 * Public theme metadata proxy for the publisher-invite + post-accept
 * landings.
 *
 * GET /api/shop/[slug]/public-theme
 *
 * Forwards to the existing `GET /shop?slug=...` upstream and projects
 * out the public-safe brand fields (logo, primary/secondary colour,
 * shop name, custom-domain). This avoids leaking the merchant's full
 * shop document into the publisher landing.
 *
 * If the operator extends the upstream `GET /shop` to surface a typed
 * `theme: { ... }` block, this proxy continues to work — it just picks
 * the typed block in preference to the legacy flat fields.
 */

import { fetchInstance } from '@/lib/fetchInstance';
import { NextResponse } from 'next/server';

type RouteContext = { params: Promise<{ slug: string }> };

interface UpstreamShopLike {
  _id?: string;
  name?: string;
  shopName?: string;
  shopSlug?: string;
  slug?: string;
  logo?: string;
  headerIcon?: string;
  theme?: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
    customDomain?: string;
  };
  textColor?: string;
  backgroundColor?: string;
  hasCustomDomain?: boolean;
  shopDomain?: string[];
}

function pickFirstString(...candidates: Array<unknown>): string | undefined {
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim();
  }
  return undefined;
}

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  if (!slug) {
    return NextResponse.json({ error: 'slug required' }, { status: 400 });
  }

  try {
    const shop = (await fetchInstance(`shop?slug=${encodeURIComponent(slug)}`, {
      cache: 'no-cache',
    })) as UpstreamShopLike;

    const theme = shop?.theme ?? {};

    const customDomain = pickFirstString(
      theme.customDomain,
      Array.isArray(shop.shopDomain) ? shop.shopDomain[0] : undefined,
    );

    const payload = {
      shopId: pickFirstString(shop._id) ?? null,
      shopSlug: pickFirstString(shop.shopSlug, shop.slug, slug),
      shopName: pickFirstString(shop.name, shop.shopName),
      logo: pickFirstString(theme.logo, shop.logo, shop.headerIcon),
      primaryColor: pickFirstString(theme.primaryColor, shop.backgroundColor),
      secondaryColor: pickFirstString(theme.secondaryColor, shop.textColor),
      fontFamily: pickFirstString(theme.fontFamily),
      customDomain,
      hasCustomDomain: Boolean(shop.hasCustomDomain),
    };

    return NextResponse.json(payload);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
      { error: 'failed to load shop theme', detail: message },
      { status: 502 },
    );
  }
}
