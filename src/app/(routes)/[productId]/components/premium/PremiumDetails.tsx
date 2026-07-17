'use client';

/**
 * PremiumDetails — the premium PDP buy column (client island).
 *
 * Owns the same product/option/sku state model as the legacy ProductClient
 * (getFirstOption / findSkuAsOption over ProductContext semantics) but renders
 * the Bloomingdale's-grade hierarchy:
 *
 *   BRAND (small caps, quiet)
 *   Title (large, confident)
 *   Price + free-returns hint
 *   Color — named swatches
 *   Size — pill-button grid + "Size guide" link (never a raw <select>)
 *   Quantity — compact stepper, visually quiet
 *   CTA — full-width black BUY NOW / ADD TO BAG
 *   "Mint to merch" — demoted to a text affordance (differentiator, not noise)
 *   Trust row — secure checkout · returns · made-to-order
 *
 * Buy routes through the MoR session exactly like ProductCartActions (#179
 * semantics: the product ObjectId comes from STATE, never the URL segment,
 * which carries the merchant handle on the slug route).
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { IProduct, ISku } from '@/types/interfaces/product/product';
import { MOR_CHECKOUT_ENABLED, variantIDs } from '@/lib/variables/variables';
import { POD_POLICY, POLICY } from '@/lib/site';
import { isPodProduct } from '@/lib/pod';
import useAppCart from '@/state/hooks/cart/useAppCart';
import productClientModel from '../details/client/context/ProductOptionsModel';
import productVariantsModel from '../details/client/components/model';
import ProductPassport from './ProductPassport';

const numericSize = (caption: string) => {
  const m = String(caption ?? '').match(/[\d.]+/);
  return m ? parseFloat(m[0]) : Number.POSITIVE_INFINITY;
};

// A usable CSS color literal — hex / rgb() / hsl(). A single-word CSS color
// keyword ("navy", "white") also paints, but a multi-word merchant color name
// ("Heather Grey", "Off White", "Navy Blue") is NOT valid CSS and paints
// nothing — an invisible swatch.
const CSS_COLOR = /^(#|rgb|hsl)/i;

// Common multi-word (and a few ambiguous single-word) merchant color names →
// representative hex, so a named-only color still renders a sensible chip.
const NAMED_HEX: Record<string, string> = {
  'heather grey': '#b0b3b8',
  'heather gray': '#b0b3b8',
  'cool heather': '#a9b3b6',
  'steel grey': '#47525c',
  'steel gray': '#47525c',
  'off white': '#f7f4ef',
  'navy blue': '#1f2a44',
  'midnight navy': '#161d2b',
  'sky blue': '#87ceeb',
  'light blue': '#add8e6',
  'royal blue': '#2b4fbb',
  'forest green': '#228b22',
  'olive green': '#6b7a3a',
  'hot pink': '#ff69b4',
  'light grey': '#d3d3d3',
  'light gray': '#d3d3d3',
  'dark grey': '#4b4f54',
  'dark gray': '#4b4f54',
  'burnt orange': '#cc5500',
  'dusty rose': '#c08497',
  'charcoal grey': '#36454f',
  'charcoal gray': '#36454f',
};

// A last-resort neutral so a swatch is NEVER invisible.
const NEUTRAL_SWATCH = '#e5e5e5';

/**
 * Resolve a guaranteed-paintable swatch color. Prefer the stored hex/rgb/hsl
 * `value` (valid-hex swatches are unchanged); then a known named-color map;
 * then a bare single-word CSS keyword; otherwise a neutral chip. The color
 * NAME is always surfaced via title/aria-label at the call site so a neutral
 * fallback is never ambiguous.
 */
const swatchColor = (caption?: string | null, value?: string | null): string => {
  const v = String(value ?? '').trim();
  if (CSS_COLOR.test(v)) return v; // stored hex/rgb/hsl wins — no regression
  const cap = String(caption ?? '').trim();
  if (CSS_COLOR.test(cap)) return cap; // caption itself may carry a hex
  const key = cap.toLowerCase();
  if (NAMED_HEX[key]) return NAMED_HEX[key]; // multi-word name → representative hex
  if (key && !key.includes(' ')) return key; // single CSS keyword ("navy") paints
  return NEUTRAL_SWATCH; // never invisible
};

export default function PremiumDetails({
  product,
  brandName,
}: {
  product: IProduct;
  brandName?: string;
}) {
  const { getFirstOption, findSkuAsOption } = productClientModel;
  const { getOptions, skuIDsMatchColor } = productVariantsModel;
  const { addItemToCart } = useAppCart();

  const [option, setOption] = useState<{ color: string | null; size: string | null }>(
    () => getFirstOption(product?.skuIDs?.[0]),
  );
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);

  const colors = useMemo(() => getOptions(product?.skuIDs, 'color'), [product, getOptions]);
  const sizes = useMemo(
    () =>
      [...getOptions(product?.skuIDs, 'size')].sort(
        (a, b) => numericSize(a.caption) - numericSize(b.caption),
      ),
    [product, getOptions],
  );

  // A no-variant / single-variant physical product exposes NO color or size
  // options, so option-based resolution can never match: getFirstOption yields
  // {color:null,size:null} and findSkuAsOption returns null for a null/null
  // query — leaving `sku` null so Buy throws "Missing variant" while the price
  // (which falls back to skuIDs[0]) still renders, masking the dead button.
  // Fall back to skuIDs[0] — the exact sku the price uses — so single-SKU
  // products are purchasable. When variant options DO exist but the chosen
  // combo is unresolvable we deliberately do NOT fall back (that would sell the
  // wrong variant); that state disables the CTA below.
  const hasVariantOptions = colors.length > 0 || sizes.length > 0;

  const sku: ISku | null | undefined = useMemo(() => {
    if (product?.product_type === 'DIGITAL') return product?.skuIDs?.[0];
    const matched = findSkuAsOption({
      color: option.color,
      size: option.size,
      skuIDs: product?.skuIDs,
    });
    if (matched) return matched;
    return hasVariantOptions ? null : product?.skuIDs?.[0];
  }, [product, option, findSkuAsOption, hasVariantOptions]);

  const sizesForColor = useMemo(
    () => (option.color ? skuIDsMatchColor(product?.skuIDs, option.color) : null),
    [product, option.color, skuIDsMatchColor],
  );
  const sizeAvailable = useCallback(
    (caption: string) => (sizesForColor ? sizesForColor.includes(caption) : true),
    [sizesForColor],
  );

  // Keep the selected size valid when the colour changes.
  useEffect(() => {
    if (!sku && sizes.length && option.color && sizesForColor?.length) {
      setOption((prev) => ({ ...prev, size: sizesForColor[0] ?? prev.size }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sku]);

  const price = sku?.price ?? product?.skuIDs?.[0]?.price ?? 0;

  // POD (made to order via Printful): the trust surface must show Printful's
  // made-to-order terms — no buyer's-remorse/size returns; damaged/misprinted/
  // defective replaced when reported within POD_POLICY.claimWindowDays of
  // delivery. Non-POD copy stays byte-identical.
  const pod = isPodProduct(product);

  // Stock gate. POD (made-to-order via Printful) and DIGITAL carry no finite
  // stock — every POD sku reports inventory.quantity 0 yet is fully purchasable
  // — so they are ALWAYS in stock here; gating them on quantity would wrongly
  // kill Buy on the entire made-to-order catalog. A physical, non-POD sku is
  // out of stock only when it reports a definite, exhausted quantity; an
  // unknown quantity stays buyable (fail-open toward the sale). This is the
  // per-combo signal: a resolvable-but-out-of-stock color+size disables the
  // CTA, distinct from the no-option fallback above (which stays buyable).
  const madeToOrder = pod || product?.product_type === 'DIGITAL';
  const stockLeft = Number(sku?.quantity) - Number(sku?.sold_units ?? 0);
  const outOfStock =
    !!sku && !madeToOrder && Number.isFinite(sku?.quantity) && stockLeft <= 0;
  const canBuy = !!sku?._id && !outOfStock;

  const buy = async () => {
    if (busy || !canBuy) return;
    setBusy(true);

    const work = MOR_CHECKOUT_ENABLED
      ? (async () => {
          // #179 semantics: state product id, never the URL segment.
          const productId = product?._id;
          if (!productId || !sku?._id) throw new Error('Missing product or variant');
          const cartToken =
            globalThis.crypto?.randomUUID?.() ??
            `mor-${Date.now()}-${Math.random().toString(36).slice(2)}`;
          const res = await fetch(`/api/mor-checkout/session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId, skuId: sku._id, quantity, cartToken }),
          });
          if (!res.ok) throw new Error(`Checkout unavailable (${res.status})`);
          const json = await res.json().catch(() => ({}));
          const url = json?.data?.checkoutUrl ?? json?.checkoutUrl;
          if (!url) throw new Error('No checkout URL returned');
          window.location.href = url;
          return url;
        })()
      : (async () => {
          if (!sku?._id) throw new Error('Missing product variant');
          return addItemToCart({ skuID: sku._id, quantity });
        })();

    toast.promise(
      work,
      MOR_CHECKOUT_ENABLED
        ? {
            loading: 'Starting secure checkout…',
            success: 'Redirecting to checkout…',
            error: 'Checkout is unavailable right now.',
          }
        : {
            loading: 'Adding to your bag…',
            success: 'Added to your bag',
            error: 'Something went wrong.',
          },
    );

    try {
      await work;
    } catch {
      /* toast already surfaced the failure */
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex w-full flex-col">
      {brandName && (
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
          {brandName}
        </p>
      )}

      <h1 className="mt-2 text-[26px] font-medium leading-8 tracking-tight text-neutral-900 md:text-[30px] md:leading-9">
        {product?.title}
      </h1>

      <div className="mt-4 flex items-baseline gap-3">
        <span className="text-xl font-semibold text-neutral-900" data-testid="premium-price">
          ${Number(price).toFixed(2)}
        </span>
        <span className="text-xs text-neutral-500">
          {pod ? 'Made to order' : <>Free {POLICY.returnWindowDays}-day returns</>}
        </span>
      </div>

      {/* Colour */}
      {colors.length > 0 && (
        <div className="mt-7">
          <p className="text-[13px] text-neutral-900">
            <span className="font-semibold">Color</span>
            {option.color && <span className="text-neutral-500"> — {option.color}</span>}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c.caption}
                type="button"
                title={c.caption}
                aria-label={`Color ${c.caption}`}
                aria-pressed={option.color === c.caption}
                onClick={() => setOption((prev) => ({ ...prev, color: c.caption }))}
                className={`h-9 w-9 rounded-full border border-neutral-300 transition-shadow ${
                  option.color === c.caption
                    ? 'ring-1 ring-neutral-900 ring-offset-2'
                    : 'hover:ring-1 hover:ring-neutral-400 hover:ring-offset-2'
                }`}
                style={{ backgroundColor: swatchColor(c.caption, c.value) }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Size — pill grid, never a raw select */}
      {sizes.length > 0 && (
        <div className="mt-7">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold text-neutral-900">
              Size
              {option.size && (
                <span className="font-normal text-neutral-500"> — {option.size}</span>
              )}
            </p>
            <a
              href="#size-guide"
              className="text-[12px] text-neutral-500 underline underline-offset-2 hover:text-neutral-900"
            >
              Size guide
            </a>
          </div>
          <div className="mt-2.5 grid grid-cols-5 gap-2 sm:grid-cols-6">
            {sizes.map((s) => {
              const selected = option.size === s.caption;
              const available = sizeAvailable(s.caption);
              return (
                <button
                  key={s.caption}
                  type="button"
                  disabled={!available}
                  aria-pressed={selected}
                  onClick={() => setOption((prev) => ({ ...prev, size: s.caption }))}
                  className={`h-10 rounded-sm border text-[13px] transition-colors ${
                    selected
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : available
                        ? 'border-neutral-300 bg-white text-neutral-900 hover:border-neutral-900'
                        : 'cursor-not-allowed border-neutral-200 text-neutral-300 line-through'
                  }`}
                >
                  {s.caption}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantity — deliberately quiet */}
      <div className="mt-7 flex items-center gap-4">
        <p className="text-[13px] font-semibold text-neutral-900">Quantity</p>
        <div className="flex h-9 items-center rounded-sm border border-neutral-300">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="w-9 text-neutral-500 hover:text-neutral-900"
          >
            −
          </button>
          <span className="w-8 text-center text-[13px] tabular-nums">{quantity}</span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setQuantity((q) => Math.min(99, q + 1))}
            className="w-9 text-neutral-500 hover:text-neutral-900"
          >
            +
          </button>
        </div>
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={buy}
        disabled={busy || !canBuy}
        aria-disabled={busy || !canBuy}
        className="mt-8 h-12 w-full rounded-sm bg-neutral-900 text-[13px] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-neutral-900"
      >
        {!sku?._id
          ? 'Unavailable'
          : outOfStock
            ? 'Out of stock'
            : MOR_CHECKOUT_ENABLED
              ? 'Buy now'
              : 'Add to bag'}
      </button>

      {/* Authenticity slot (product-passport strategy 2026-07-16). NOT a
          "Mint it to merch" link — "Mint to Merch" is a CREATOR mechanism and
          belongs on a creator surface, not dressed up as a provenance affordance
          on a buy page. This is the conditional onchain product-passport module
          (Phase 1): flag-gated (NEXT_PUBLIC_PDP_PASSPORT_ENABLED), read-only,
          and it renders NOTHING unless a CONFIRMED onchain DPP proof exists for
          the item (never on pending/simulated) — so it is invisible by default
          and self-fail-open. */}
      <ProductPassport product={product} />

      {/* Trust row — same POLICY source as the sitewide footer. POD items
          carry Printful's made-to-order terms instead of the return window. */}
      {pod ? (
        <p className="mt-6 text-[12px] leading-5 text-neutral-500">
          Secure checkout · Made to order — ships in {POLICY.handlingTimeDays} ·
          Damaged or misprinted? We&apos;ll replace it — report within{' '}
          {POD_POLICY.claimWindowDays} days of delivery.{' '}
          <Link
            href="/returns-policy"
            className="underline underline-offset-2 hover:text-neutral-900"
          >
            Return policy
          </Link>
        </p>
      ) : (
        <p className="mt-6 text-[12px] leading-5 text-neutral-500">
          Secure checkout · {POLICY.returnWindowDays}-day returns · Made to order —
          ships in {POLICY.handlingTimeDays}
        </p>
      )}
    </div>
  );
}
