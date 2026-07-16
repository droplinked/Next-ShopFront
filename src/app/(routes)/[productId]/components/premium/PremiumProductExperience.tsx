/**
 * PremiumProductExperience — the premium PDP body (server shell).
 *
 * The Bloomingdale's-grade composition the shopper (or shopping agent) lands
 * on: breadcrumb → [gallery | buy column] → detail accordions. Server
 * component: copy processing (sanitize + boilerplate strip + size-chart
 * relocation) happens here so accordion content is in the crawlable HTML;
 * only the gallery and buy column hydrate.
 *
 * Flag-gated by NEXT_PUBLIC_PREMIUM_PDP_ENABLED (see ProductExperience.tsx) —
 * the legacy body remains byte-identical when OFF.
 */

import Link from 'next/link';
import { inter } from '@/styles/fonts';
import { POD_POLICY, POLICY } from '@/lib/site';
import { isPodProduct } from '@/lib/pod';
import type { IProduct } from '@/types/interfaces/product/product';
import { sanitizeHtml } from '../../product/[slug]/lib/sanitize-html';
import styles from '../../product/[slug]/description.module.css';
import { splitDescription } from './description-content';
import Accordion, { AccordionItem } from './Accordion';
import MediaGallery from './MediaGallery';
import PremiumDetails from './PremiumDetails';

export interface PremiumBrand {
  /** Display name for the brand line + breadcrumb (e.g. "UNSTOPPABLE"). */
  name: string;
  /** Optional internal link for the breadcrumb crumb. */
  href?: string;
}

export default function PremiumProductExperience({
  product,
  brand,
}: {
  product: IProduct;
  brand?: PremiumBrand;
}) {
  const { descriptionHtml, sizeGuideHtml } = splitDescription(
    sanitizeHtml(product?.description || ''),
  );

  return (
    <main className={`${inter.className} mx-auto w-full max-w-6xl px-6 pb-20 pt-6 md:px-8`}>
      {/* breadcrumb — orientation for shoppers and structure for agents */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-1.5 text-[12px] text-neutral-500">
          <li>
            <Link href="/" className="hover:text-neutral-900 hover:underline">
              Home
            </Link>
          </li>
          {brand?.name && (
            <>
              <li aria-hidden>/</li>
              <li>
                {brand.href ? (
                  <Link href={brand.href} className="hover:text-neutral-900 hover:underline">
                    {brand.name}
                  </Link>
                ) : (
                  <span>{brand.name}</span>
                )}
              </li>
            </>
          )}
          <li aria-hidden>/</li>
          <li aria-current="page" className="text-neutral-900">
            {product?.title}
          </li>
        </ol>
      </nav>

      <div className="flex flex-col gap-10 md:flex-row md:items-start md:gap-14">
        {/* media column */}
        <div className="w-full md:sticky md:top-24 md:w-[52%]">
          <MediaGallery media={product?.media} alt={product?.title || 'Product image'} />
        </div>

        {/* details column */}
        <div className="w-full md:w-[44%]">
          <PremiumDetails product={product} brandName={brand?.name} />

          {/* detail accordions — server-rendered content */}
          <div className="mt-10">
            <Accordion>
              {descriptionHtml && (
                <AccordionItem title="Description" defaultOpen>
                  <div
                    className={`${styles.rich} text-[14px] leading-6 text-neutral-600`}
                    dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                  />
                </AccordionItem>
              )}
              {sizeGuideHtml && (
                <div id="size-guide">
                  <AccordionItem title="Size guide">
                    <div
                      className={`${styles.rich} overflow-x-auto text-[13px] leading-6 text-neutral-600`}
                      dangerouslySetInnerHTML={{ __html: sizeGuideHtml }}
                    />
                  </AccordionItem>
                </div>
              )}
              <AccordionItem title="Shipping & returns">
                <div className="flex flex-col gap-2 text-[14px] leading-6 text-neutral-600">
                  <p>
                    Every piece is made to order and ships in {POLICY.handlingTimeDays}{' '}
                    with tracking.
                  </p>
                  {isPodProduct(product) ? (
                    // POD (Printful) terms: made to order, so no size-change /
                    // change-of-mind returns; damaged/misprinted/defective is
                    // covered when reported within the claim window.
                    <p>
                      Each piece is printed just for you, so returns for size or
                      change of mind aren&apos;t available. If your order arrives
                      damaged, misprinted, or defective, contact us within{' '}
                      {POD_POLICY.claimWindowDays} days of delivery — we&apos;ll
                      replace it or refund you in full.
                    </p>
                  ) : (
                    <p>
                      Returns are free within {POLICY.returnWindowDays} days of delivery —
                      refunds go back to your {POLICY.refundMethod} within{' '}
                      {POLICY.refundProcessingDays}.
                    </p>
                  )}
                  <p className="text-[13px]">
                    <Link
                      href="/shipping-policy"
                      className="underline underline-offset-2 hover:text-neutral-900"
                    >
                      Shipping policy
                    </Link>{' '}
                    ·{' '}
                    <Link
                      href="/returns-policy"
                      className="underline underline-offset-2 hover:text-neutral-900"
                    >
                      Returns &amp; refunds
                    </Link>{' '}
                    ·{' '}
                    <Link
                      href="/contact"
                      className="underline underline-offset-2 hover:text-neutral-900"
                    >
                      Contact us
                    </Link>
                  </p>
                </div>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>
    </main>
  );
}
