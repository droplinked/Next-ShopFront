import type { Metadata } from 'next';
import { cn } from '@/lib/utils/cn/cn';
import { app_vertical } from '@/lib/variables/variables';
import { getCopyVariant, HERO_COPY } from '@/lib/cost-comparator/copy-variants';
import Hero from './components/Hero';
import PageClient from './components/PageClient';

/**
 * `/affiliate-vs-networks` — merchant-direct displacement landing.
 *
 * SEO-first: metadata + JSON-LD are emitted at request time using the
 * active copy variant so search engines see the same posture the
 * operator has flipped on at the moment of crawl.
 *
 * The slug is variable in case the operator wants per-network landing
 * pages (`/awin-alternative` etc.) — those would re-export this same
 * page module with their own `generateMetadata` overrides.
 */
export async function generateMetadata(): Promise<Metadata> {
  const variant = getCopyVariant();
  const copy = HERO_COPY[variant];
  const description =
    'Run your own affiliate program on droplinked. Skip the 25–30% network take-rate of AWIN, Impact, and Rakuten. USDC payouts settle in seconds — see your savings with the cost comparator.';

  return {
    title: copy.headline,
    description,
    keywords: [
      'AWIN alternative',
      'Impact.com alternative',
      'Rakuten Advertising alternative',
      'USDC affiliate payouts',
      'merchant-direct affiliate program',
      'affiliate network cost comparison',
      'onchain affiliate attribution',
    ],
    openGraph: {
      title: copy.headline,
      description,
      type: 'website',
      url: '/affiliate-vs-networks',
    },
    twitter: {
      card: 'summary_large_image',
      title: copy.headline,
      description,
    },
    alternates: {
      canonical: '/affiliate-vs-networks',
    },
    robots: { index: true, follow: true },
  };
}

const JsonLd = () => {
  const variant = getCopyVariant();
  const copy = HERO_COPY[variant];
  const payload = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: 'droplinked',
        url: 'https://droplinked.com',
        description:
          'Merchant-direct commerce stack: affiliate, onchain attribution, USDC payouts, lending.',
      },
      {
        '@type': 'Product',
        name: 'droplinked affiliate stack',
        description: copy.tagline,
        brand: { '@type': 'Brand', name: 'droplinked' },
        offers: {
          '@type': 'Offer',
          priceCurrency: 'USD',
          description: 'Merchant-direct affiliate program. 1% droplinked fee, USDC payouts.',
        },
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
};

export default function AffiliateVsNetworksPage() {
  const variant = getCopyVariant();
  return (
    <main
      className={cn(app_vertical, 'w-full min-h-[60vh] gap-8 pb-16')}
      data-testid="cc-landing-page"
      data-copy-variant={variant}
    >
      <JsonLd />
      <Hero
        variant={variant}
        onPrimaryCtaHref="#calculator"
        onSecondaryCtaHref="#lead-capture"
      />
      <PageClient variant={variant} />
    </main>
  );
}
