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
import { toast } from 'sonner';
import { IProduct, ISku } from '@/types/interfaces/product/product';
import { MOR_CHECKOUT_ENABLED, variantIDs } from '@/lib/variables/variables';
import { POLICY } from '@/lib/site';
import useAppCart from '@/state/hooks/cart/useAppCart';
import productClientModel from '../details/client/context/ProductOptionsModel';
import productVariantsModel from '../details/client/components/model';

const numericSize = (caption: string) => {
  const m = String(caption ?? '').match(/[\d.]+/);
  return m ? parseFloat(m[0]) : Number.POSITIVE_INFINITY;
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

  const sku: ISku | null | undefined = useMemo(
    () =>
      product?.product_type === 'DIGITAL'
        ? product?.skuIDs?.[0]
        : findSkuAsOption({ color: option.color, size: option.size, skuIDs: product?.skuIDs }),
    [product, option, findSkuAsOption],
  );

  const colors = useMemo(() => getOptions(product?.skuIDs, 'color'), [product, getOptions]);
  const sizes = useMemo(
    () =>
      [...getOptions(product?.skuIDs, 'size')].sort(
        (a, b) => numericSize(a.caption) - numericSize(b.caption),
      ),
    [product, getOptions],
  );
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

  const buy = async () => {
    if (busy) return;
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
          Free {POLICY.returnWindowDays}-day returns
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
                aria-label={`Color ${c.caption}`}
                aria-pressed={option.color === c.caption}
                onClick={() => setOption((prev) => ({ ...prev, color: c.caption }))}
                className={`h-9 w-9 rounded-full border border-neutral-300 transition-shadow ${
                  option.color === c.caption
                    ? 'ring-1 ring-neutral-900 ring-offset-2'
                    : 'hover:ring-1 hover:ring-neutral-400 hover:ring-offset-2'
                }`}
                style={{
                  backgroundColor: /^#|^rgb|^hsl/.test(String(c.value))
                    ? String(c.value)
                    : String(c.caption).toLowerCase(),
                }}
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
        disabled={busy}
        className="mt-8 h-12 w-full rounded-sm bg-neutral-900 text-[13px] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-neutral-700 disabled:opacity-60"
      >
        {MOR_CHECKOUT_ENABLED ? 'Buy now' : 'Add to bag'}
      </button>

      {/* Phase 0 (product-passport strategy 2026-07-16): the authenticity slot
          under the CTA is intentionally EMPTY, not a "Mint it to merch" link.
          "Mint to Merch" is a CREATOR mechanism (upload artwork → mint a POD
          design) and belongs on a creator surface, not dressed up as an
          ownership/provenance affordance on a buy page. This slot is reserved
          for the conditional onchain product-passport / authenticity module
          (VerifiedOnchainBadge + dpp/proof:gtin) — rendered only when a
          confirmed onchain record exists for the item. */}

      {/* Trust row — same POLICY source as the sitewide footer */}
      <p className="mt-6 text-[12px] leading-5 text-neutral-500">
        Secure checkout · {POLICY.returnWindowDays}-day returns · Made to order —
        ships in {POLICY.handlingTimeDays}
      </p>
    </div>
  );
}
