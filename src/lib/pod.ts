/**
 * pod.ts — the ONE print-on-demand (POD) product detector.
 *
 * POD items are produced per order by the print partner (Printful), so every
 * trust surface must render made-to-order terms (see POD_POLICY in site.ts),
 * never the standard return window — a made-to-order item promising "free
 * 14-day returns" is a promise fulfillment cannot deliver.
 *
 * The type spelling differs by data source, so match both:
 *   • product-v2 public API carries `type: "pod"` (uppercased to "POD" by the
 *     V2→legacy adapter in product-data.ts, which maps type/product_type via
 *     `String(v2.type).toUpperCase()`).
 *   • the legacy shop-scoped product API carries `PRINT_ON_DEMAND`
 *     (product-type enum on droplinked-backend).
 */
import type { IProduct } from '@/types/interfaces/product/product';

const POD_TYPES = new Set(['POD', 'PRINT_ON_DEMAND']);

/** True when the product is print-on-demand (made to order, Printful terms). */
export function isPodProduct(
  product: Pick<IProduct, 'type' | 'product_type'> | null | undefined,
): boolean {
  if (!product) return false;
  return (
    POD_TYPES.has(String(product.type ?? '').toUpperCase()) ||
    POD_TYPES.has(String(product.product_type ?? '').toUpperCase())
  );
}
