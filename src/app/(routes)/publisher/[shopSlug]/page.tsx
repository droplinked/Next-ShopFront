/**
 * Post-acceptance publisher landing for a single merchant.
 *
 * Route: /publisher/[shopSlug]
 *
 * NOTE on path shape: the original spec called for `/{shop-slug}/publisher`
 * but the existing `(routes)/[productId]` dynamic segment occupies the root
 * of `(routes)`. Adding a second sibling dynamic segment is a Next.js
 * routing collision (App-Router refuses to build it). To stay strictly
 * additive — i.e. not refactor the product-detail route in this PR — we
 * mount the publisher landing under a static `/publisher` prefix instead.
 *
 * Renders a merchant-themed list of the programs THIS publisher has
 * joined under THIS merchant. Same theme resolver / inline-style
 * mechanism as the invitation landing.
 *
 * If the merchant slug isn't found, falls back to the droplinked default
 * theme + a friendly "no programs yet" empty state. The white-label
 * chrome suppression (no global header/footer) is keyed off the
 * `/publisher` route prefix in AppLayout.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  listPublisherProgramsForShop,
  getRuntimeOrigin,
} from '@/services/publisher/service';
import {
  resolveMerchantTheme,
  themeAsInlineStyle,
} from '@/lib/merchant-theme/merchant-theme';
import PoweredByDroplinkedFooter from '../../publisher-invite/[token]/components/PoweredByDroplinkedFooter';
import { formatCommission } from '../../publisher-invite/[token]/components/ProgramHighlights';
import type { IPublisherInvitationMerchantBrand } from '@/types/interfaces/publisher/invitation';

type PageProps = { params: Promise<{ shopSlug: string }> };

async function getMerchantBrandFromShopApi(
  shopSlug: string,
  origin: string,
): Promise<IPublisherInvitationMerchantBrand | null> {
  try {
    const res = await fetch(
      `${origin.replace(/\/$/, '')}/api/shop/${encodeURIComponent(shopSlug)}/public-theme`,
      { cache: 'no-store' },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as Partial<IPublisherInvitationMerchantBrand>;
    if (!json) return null;
    return {
      shopId: json.shopId ?? '',
      shopSlug: json.shopSlug ?? shopSlug,
      shopName: json.shopName ?? shopSlug,
      logo: json.logo,
      primaryColor: json.primaryColor,
      secondaryColor: json.secondaryColor,
      fontFamily: json.fontFamily,
      customDomain: json.customDomain,
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { shopSlug } = await params;
  const origin = getRuntimeOrigin();
  const brand = await getMerchantBrandFromShopApi(shopSlug, origin);
  const merchantName = brand?.shopName ?? shopSlug;
  return {
    title: `${merchantName} — Publisher hub`,
    description: `Your affiliate programs with ${merchantName} on droplinked.`,
    robots: { index: false, follow: false },
  };
}

export default async function PublisherShopHubPage({ params }: PageProps) {
  const { shopSlug } = await params;
  const origin = getRuntimeOrigin();
  const [brand, programs] = await Promise.all([
    getMerchantBrandFromShopApi(shopSlug, origin),
    listPublisherProgramsForShop(shopSlug, origin),
  ]);

  const theme = resolveMerchantTheme(brand);
  const inlineStyle = themeAsInlineStyle(theme);

  return (
    <div className="min-h-screen bg-white" style={inlineStyle}>
      <header
        className="w-full px-6 py-10"
        style={{
          backgroundColor: 'var(--mt-primary)',
          color: 'var(--mt-primary-fg)',
        }}
      >
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          {theme.logoUrl ? (
            <Image
              src={theme.logoUrl}
              alt={theme.brandName}
              width={48}
              height={48}
              className="h-12 w-12 rounded-lg object-contain bg-white/10"
              unoptimized
            />
          ) : null}
          <div>
            <p className="text-xs uppercase tracking-wide opacity-80">
              Publisher hub
            </p>
            <h1 className="text-2xl md:text-3xl font-bold">{theme.brandName}</h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <h2 className="text-xl font-semibold text-black mb-6">Your programs</h2>
        {programs.length === 0 ? (
          <div className="rounded-xl border border-black/10 p-10 text-center bg-white">
            <p className="text-base text-black/70">
              You don&apos;t have any active programs with {theme.brandName} yet.
            </p>
            <p className="text-sm text-black/50 mt-2">
              When the merchant invites you to a program, it will appear here.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {programs.map((p) => (
              <li
                key={p.programId}
                className="rounded-xl border border-black/10 bg-white p-6 flex flex-col gap-3"
                style={{ borderTop: '4px solid var(--mt-primary)' }}
              >
                <h3 className="font-semibold text-black text-lg">{p.programName}</h3>
                <p className="text-sm text-black/60">
                  Commission:{' '}
                  <span className="font-medium text-black">
                    {formatCommission({
                      programName: p.programName,
                      commissionRate: p.commissionRate,
                      commissionType: p.commissionType,
                      commissionCurrency: p.commissionCurrency,
                    })}
                  </span>
                </p>
                {typeof p.recentEarningsUsd === 'number' && (
                  <p className="text-sm text-black/60">
                    Recent earnings:{' '}
                    <span className="font-medium text-black">
                      ${p.recentEarningsUsd.toFixed(2)} USD
                    </span>
                  </p>
                )}
                {p.dashboardUrl ? (
                  <Link
                    href={p.dashboardUrl}
                    className="mt-2 inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium text-sm"
                    style={{
                      backgroundColor: 'var(--mt-primary)',
                      color: 'var(--mt-primary-fg)',
                    }}
                  >
                    Open dashboard
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </main>

      <PoweredByDroplinkedFooter />
    </div>
  );
}
