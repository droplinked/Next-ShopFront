/**
 * /m/[slug] — per-merchant SSR landing page (Phase 1, closes #100).
 *
 * AEO/GEO optimization surface: Schema.org JSON-LD + OG + Twitter Card
 * so LLM crawlers (ChatGPT, Claude, Perplexity) can ingest merchant
 * catalogs without a separate API fetch.
 *
 * BE dependency: apiv3.droplinked.com/v2/merchants/:slug/discovery-profile
 * (droplinked-backend#2096 — KYB tier filter).
 * If the endpoint is not live yet, fetchDiscoveryProfile returns null
 * and this page renders notFound() — fully 5xx-safe.
 *
 * Tier gating:
 *   full           → hero + product grid + storefront CTA + full JSON-LD
 *   directory_only → minimal hero (name + "View storefront") + sparse JSON-LD
 *
 * ISR: 5 minutes (revalidate = 300).
 */

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { fetchDiscoveryProfile, type DiscoveryProfile } from "./lib/discovery-profile";
import MerchantHero from "./components/MerchantHero";
import MerchantProductGrid from "./components/MerchantProductGrid";

// ISR — revalidate every 5 minutes
export const revalidate = 300;

// ---- types ----

interface PageProps {
  params: Promise<{ slug: string }>;
}

// ---- metadata ----

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = await fetchDiscoveryProfile(slug);

  if (!profile) {
    return {
      title: "Merchant not found | droplinked",
    };
  }

  const title = `${profile.name} on droplinked`;
  const description =
    profile.verifiedTier === "full"
      ? profile.description ||
        `Shop ${profile.name}'s products on droplinked — verified onchain commerce.`
      : `${profile.name} is listed on droplinked — the onchain commerce protocol.`;

  const canonicalUrl = `https://droplinked.com/m/${slug}`;
  const ogImage = profile.logoUrl || undefined;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "website",
      url: canonicalUrl,
      title,
      description,
      siteName: "droplinked",
      images: ogImage ? [{ url: ogImage, alt: `${profile.name} logo` }] : [],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: ogImage ? [ogImage] : [],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

// ---- JSON-LD helpers ----

function buildOrganizationJsonLd(profile: DiscoveryProfile) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: profile.name,
    description: profile.description,
    url: profile.websiteUrl || `https://droplinked.com/m/${profile.slug}`,
    logo: profile.logoUrl || undefined,
    sameAs: [
      profile.storefrontUrl,
      profile.social?.twitter,
      profile.social?.instagram,
      profile.social?.linkedin,
    ].filter(Boolean) as string[],
    // Droplinked-specific extension: signals to LLM crawlers that this is
    // a blockchain-verified commerce entity.
    additionalType: "https://schema.org/OnlineBusiness",
    identifier: {
      "@type": "PropertyValue",
      name: "droplinked_slug",
      value: profile.slug,
    },
  };
}

function buildProductListJsonLd(profile: DiscoveryProfile) {
  if (profile.topProducts.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${profile.name} — Featured Products`,
    url: `https://droplinked.com/m/${profile.slug}`,
    numberOfItems: profile.topProducts.length,
    itemListElement: profile.topProducts.map((p, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Product",
        name: p.title,
        description: p.description,
        url: p.productUrl,
        image: p.imageUrl,
        offers: {
          "@type": "Offer",
          price: p.price,
          priceCurrency: p.currency,
          availability: "https://schema.org/InStock",
          seller: {
            "@type": "Organization",
            name: profile.name,
          },
        },
      },
    })),
  };
}

// ---- page ----

export default async function MerchantPage({ params }: PageProps) {
  const { slug } = await params;
  const profile = await fetchDiscoveryProfile(slug);

  if (!profile) {
    notFound();
  }

  const orgJsonLd = buildOrganizationJsonLd(profile);
  const productListJsonLd =
    profile.verifiedTier === "full" ? buildProductListJsonLd(profile) : null;

  return (
    <>
      {/* Schema.org JSON-LD — inline in <body> per Next.js App Router convention */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      {productListJsonLd && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productListJsonLd) }}
        />
      )}

      <main className="min-h-screen bg-surface">
        <MerchantHero profile={profile} />

        {profile.verifiedTier === "full" && (
          <MerchantProductGrid
            products={profile.topProducts}
            merchantName={profile.name}
          />
        )}

        {/* Attribution footer strip */}
        <div className="py-8 px-6 text-center">
          <p className="text-xs text-ink-faint">
            Powered by{" "}
            <a
              href="https://droplinked.com"
              className="text-mint-500 hover:text-mint-400 transition-colors"
            >
              droplinked
            </a>{" "}
            — onchain commerce protocol
          </p>
        </div>
      </main>
    </>
  );
}
