'use client';
import { AppDropDownInput } from '@/components/ui';
import { variantIDs } from '@/lib/variables/variables';
import { useCallback, useContext, useEffect, useMemo } from 'react';
import { ProductContext } from '../context';
import productVariantsModel from './model';

/**
 * Size selection as a single clean dropdown.
 *
 * Previously this rendered every size as a grid of ~30 outlined boxes with a
 * low-contrast (pale) selected state — noisy, and the selection read as
 * secondary. A dropdown (react-select via AppDropDownInput, the same control the
 * checkout uses) makes size a deliberate, high-contrast, primary choice, is
 * searchable/keyboard-friendly for long shoe-size lists, and scales cleanly from
 * 2 to 30 options. Sizes arrive unsorted from the SKU options, so we order them
 * numerically. Sizes unavailable for the chosen colour are disabled, not hidden.
 */
function ProductSizeSelector() {
  const { skuIDsMatchColor, getOptions } = productVariantsModel;
  const {
    states: {
      product,
      option: { size, color },
      sku,
    },
    methods: { updateOption },
  } = useContext(ProductContext);

  const match = useMemo(
    () => skuIDsMatchColor(product?.skuIDs, color || ''),
    [product, color]
  );

  const sizes = useMemo(
    () => getOptions(product?.skuIDs, 'size'),
    [product, match, color]
  );

  const active = useCallback(
    (caption: string) =>
      product?.skuIDs?.find((el: any) =>
        el?.options?.find((item: any) => item.variantID === variantIDs.color._id)
      )
        ? match.includes(caption)
        : true,
    [product, match]
  );

  useEffect(() => {
    !sku && sizes.length && color && updateOption('size', match[0]);
  }, [sku]);

  // Captions look like "8.5 US" / "11 US" — order by the leading numeric size so
  // the dropdown reads naturally (6 → 17), not by SKU insertion order.
  const numericSize = (caption: string) => {
    const m = String(caption ?? '').match(/[\d.]+/);
    return m ? parseFloat(m[0]) : Number.POSITIVE_INFINITY;
  };

  const options = useMemo(
    () =>
      [...sizes]
        .sort((a, b) => numericSize(a.caption) - numericSize(b.caption))
        .map((el) => ({
          value: el.caption,
          label: el.caption,
          // react-select honours isDisabled at runtime; the interface types the
          // base { value, label } shape, this extra flag is additive.
          isDisabled: !active(el.caption),
        })),
    [sizes, active]
  );

  const selected = useMemo(
    () => options.find((o) => o.value === size) ?? null,
    [options, size]
  );

  return sizes.length ? (
    <div className="flex flex-col gap-2 w-full max-w-xs">
      <AppDropDownInput
        name="size"
        label="Size"
        placeholder="Choose your size"
        options={options}
        value={selected}
        select={(opt: any) => opt?.value && updateOption('size', opt.value)}
      />
    </div>
  ) : null;
}

export default ProductSizeSelector;
