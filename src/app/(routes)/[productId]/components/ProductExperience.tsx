/**
 * ProductExperience — the ONE shared, interactive product body.
 *
 * WHY THIS EXISTS (the "two experiences" consolidation)
 * -----------------------------------------------------
 * The same product was reachable at two URLs with two different bodies:
 *   • /<productId>                       → this interactive body (slider +
 *     variant/qty/Buy-now/Mint + description), fed by getInteractiveProduct().
 *   • /<merchant>/product/<slug>         → a SEO landing page that rendered a
 *     static price teaser off the lean structured-data endpoint (sparse images →
 *     black thumbnails) and a "Buy now" that BOUNCED to /<productId>.
 *
 * A shopper (or Googlebot) landing on the GMC-registered slug URL hit a
 * read-only dead-end and had to jump to a second page to transact. This
 * component is the single body both routes now render, so the slug landing
 * page is fully transactional (Buy in place) with the SAME rich media the
 * interactive route uses — no bounce, no divergent image set.
 *
 * Server component (no 'use client'): it only composes the client subtrees
 * (ProductSlider / ProductDetails→ProductClient / ProductDescription), which
 * carry their own interactivity + cart context. Rendering it under the SSR
 * slug route keeps the price/title/availability in the server HTML for the
 * GMC landing-page crawler while hydrating Buy-now on the client.
 */

import { AppSeparator } from '@/components/ui';
import type { IProduct } from '@/types/interfaces/product/product';
import { PREMIUM_PDP_ENABLED } from '@/lib/variables/variables';
import ProductSlider from './ProductSlider';
import ProductDetails from './details/ProductDetails';
import ProductDescription from './ProductDescription';
import PremiumProductExperience, {
  type PremiumBrand,
} from './premium/PremiumProductExperience';

export default function ProductExperience({
  product,
  brand,
}: {
  product: IProduct;
  /** Optional brand context (slug route knows the merchant; id route may not). */
  brand?: PremiumBrand;
}) {
  // Premium body (flag-gated): Bloomingdale's-grade composition — breadcrumb,
  // thumbnail-rail gallery, pill sizes, accordions, POD boilerplate stripped.
  // OFF → the legacy body below stays byte-identical.
  if (PREMIUM_PDP_ENABLED) {
    return <PremiumProductExperience product={product} brand={brand} />;
  }

  return (
    <main className="container px-8 flex items-start md:flex-row flex-col justify-center w-full gap-12 mt-20">
      <div className="min-w-full md:min-w-[40%] md:sticky left-0 top-24">
        <ProductSlider media={product?.media} />
      </div>
      <div className="flex flex-col gap-9 min-w-full md:min-w-[60%]">
        <ProductDetails product={product} />
        <AppSeparator />
        <ProductDescription description={product?.description || ''} />
      </div>
    </main>
  );
}
