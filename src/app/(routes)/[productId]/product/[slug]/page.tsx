/**
 * /<merchant>/product/<slug> — per-product SSR landing page.
 *
 * THE fix for the Google Merchant Center "Misrepresentation" suspension:
 * the GMC feed links to `https://shop.droplinked.com/<merchant>/product/<slug>`,
 * but that path previously fell through to a content-less apex client shell
 * with NO product — so Googlebot / GMC's landing-page check saw no product
 * matching the feed item → Misrepresentation.
 *
 * This route server-renders the SPECIFIC product (title, price, image,
 * availability, description) + Schema.org Product JSON-LD + correct metadata,
 * with canonical = the served `shop.droplinked.com` URL (host-consistent
 * with the feed link). A crawler now sees a real product.
 *
 * ── ROUTE PLACEMENT / COLLISION HANDLING ─────────────────────────────────
 * The app already has a root single-segment dynamic route:
 *   src/app/(routes)/[productId]/page.tsx   →  /<productId>   (v1, by ObjectId)
 * Next.js forbids two DIFFERENT slug names at the same dynamic path position
 * ("You cannot use different slug names for the same dynamic path"), so we
 * canNOT add `src/app/[merchant]/...`. Instead this route nests UNDER the
 * existing first segment, REUSING the `[productId]` slug name:
 *   src/app/(routes)/[productId]/product/[slug]/page.tsx → /<merchant>/product/<slug>
 * Here `params.productId` actually carries the MERCHANT handle (aliased to
 * `merchant` below). The existing single-segment route is untouched and
 * still resolves `/<productId>`; this 3-segment route resolves the feed path.
 *
 * BE dependency (already live, @Public, no auth):
 *   apiv3.droplinked.com/shop/:shopUrl/product/:productSlug/structured-data
 *
 * ISR: 5 minutes (revalidate = 300). Fully 5xx-safe (notFound() on null).
 */

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  fetchStructuredData,
  toProductView,
  buildServedUrl,
} from "./lib/structured-data";
import { POLICY } from "@/lib/site";

// ISR — revalidate every 5 minutes.
export const revalidate = 300;

// ---- types ----

// NOTE: `productId` is the folder/slug name inherited from the parent
// dynamic segment, but it carries the MERCHANT handle on this route.
interface PageProps {
  params: Promise<{ productId: string; slug: string }>;
}

// ---- metadata ----

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { productId: merchant, slug } = await params;
  const data = await fetchStructuredData(merchant, slug);

  if (!data) {
    return { title: "Product not found | droplinked" };
  }

  const view = toProductView(data);
  // Canonical = the SERVED url, host-consistent with the GMC feed link.
  const canonicalUrl = buildServedUrl(merchant, slug);

  const title = view.name ? `${view.name} | droplinked` : "Product | droplinked";
  const description =
    view.description ||
    `${view.name}${view.brandName ? ` by ${view.brandName}` : ""} — available on droplinked.`;
  const ogImage = view.images[0];

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: "website",
      url: canonicalUrl,
      title: data.openGraph["og:title"] || title,
      description: data.openGraph["og:description"] || description,
      siteName: data.openGraph["og:site_name"] || "droplinked",
      images: ogImage ? [{ url: ogImage, alt: view.name }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: data.openGraph["twitter:title"] || title,
      description: data.openGraph["twitter:description"] || description,
      images: ogImage ? [ogImage] : [],
    },
    robots: { index: true, follow: true },
  };
}

// ---- page ----

export default async function ProductPage({ params }: PageProps) {
  const { productId: merchant, slug } = await params;
  const data = await fetchStructuredData(merchant, slug);

  if (!data) {
    notFound();
  }

  const view = toProductView(data);
  const heroImage = view.images[0];
  const galleryImages = view.images.slice(1, 5);
  const priceLabel = view.price
    ? `${view.price} ${view.priceCurrency}`
    : "Price unavailable";

  // The interactive product page (mounts cart actions → guest checkout) is
  // keyed by the product ObjectId at `/<productId>`. The Buy CTA must lead
  // there — NOT back to this same canonical URL, which would be a dead-end a
  // reviewer cannot get past. Fall back to the canonical URL only when the
  // structured-data payload carried no product id.
  const purchaseUrl = data.productId ? `/${data.productId}` : view.canonicalUrl;

  return (
    <>
      {/* Schema.org Product JSON-LD — host-normalised to shop.droplinked.com.
          This is what Googlebot / GMC's landing-page check reads to match
          the feed item. Inline per Next.js App Router convention. */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(data.jsonLd) }}
      />

      <main className="container mx-auto px-6 md:px-8 py-12 flex flex-col md:flex-row items-start gap-10 max-w-6xl">
        {/* ── media column ── */}
        <div className="w-full md:w-1/2">
          {heroImage ? (
            // Plain <img> (not next/image): product images come from many
            // hosts (S3, Printful, CDN). A plain tag always server-renders
            // and never 500s on an unconfigured remote-image host — exactly
            // what the GMC landing-page crawler must see.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={heroImage}
              alt={view.name}
              width={800}
              height={800}
              className="w-full h-auto rounded-lg object-cover bg-surface-1"
              loading="eager"
            />
          ) : (
            <div className="w-full aspect-square rounded-lg bg-surface-1" />
          )}

          {galleryImages.length > 0 && (
            <div className="mt-4 grid grid-cols-4 gap-3">
              {galleryImages.map((img, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={img + i}
                  src={img}
                  alt={`${view.name} — view ${i + 2}`}
                  width={160}
                  height={160}
                  className="w-full h-auto rounded-md object-cover bg-surface-1"
                  loading="lazy"
                />
              ))}
            </div>
          )}
        </div>

        {/* ── details column ── */}
        <div className="w-full md:w-1/2 flex flex-col gap-5">
          {view.brandName && (
            <p className="text-sm uppercase tracking-wide text-ink-faint">
              {view.brandName}
            </p>
          )}

          <h1 className="text-3xl md:text-4xl font-semibold text-ink">
            {view.name}
          </h1>

          <div className="flex items-center gap-4">
            <span className="text-2xl font-bold text-ink" data-testid="product-price">
              {priceLabel}
            </span>
            <span
              className={
                view.inStock
                  ? "text-sm font-medium text-emerald-600"
                  : "text-sm font-medium text-red-500"
              }
              data-testid="product-availability"
            >
              {view.availabilityLabel}
            </span>
          </div>

          {view.description && (
            <p className="text-base leading-relaxed text-ink-muted whitespace-pre-line">
              {view.description}
            </p>
          )}

          {/* Buy / view CTA → the interactive product page (cart + checkout).
              Never links back to this same canonical URL (a review dead-end). */}
          <a
            href={purchaseUrl}
            className="inline-flex items-center justify-center rounded-lg bg-mint-500 hover:bg-mint-400 transition-colors px-6 py-3 text-base font-semibold text-black w-full md:w-auto"
          >
            {view.inStock ? "Buy now" : "View product"}
          </a>

          {/* Trust affordances a reviewer sees on the feed landing page. */}
          <p className="text-xs text-ink-faint">
            Secure checkout · {POLICY.returnWindowDays}-day{" "}
            <a
              href="/returns-policy"
              className="text-mint-500 hover:text-mint-400 transition-colors"
            >
              returns
            </a>{" "}
            ·{" "}
            <a
              href="/shipping-policy"
              className="text-mint-500 hover:text-mint-400 transition-colors"
            >
              shipping info
            </a>{" "}
            ·{" "}
            <a
              href="/contact"
              className="text-mint-500 hover:text-mint-400 transition-colors"
            >
              contact
            </a>
          </p>

          {view.sku && (
            <p className="text-xs text-ink-faint">SKU: {view.sku}</p>
          )}

          <p className="text-xs text-ink-faint mt-2">
            Sold on{" "}
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
