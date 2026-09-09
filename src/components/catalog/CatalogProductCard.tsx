/**
 * CatalogProductCard — ONE product tile, shared by every server-rendered
 * product grid (the platform-root catalog and the per-shop home).
 *
 * Extracted verbatim from `MarketplaceCatalog` so the root grid's markup is
 * byte-identical to before; the shop home reuses it rather than growing a
 * second, drifting copy of the same card.
 *
 * Plain <img> (not next/image): product thumbnails come from arbitrary
 * per-shop CDN hosts, so no next.config remotePatterns entry is needed and
 * the tag always server-renders (what a crawler must see).
 */

import Link from "next/link";
import type { CatalogProduct } from "@/lib/catalog/marketplace-catalog-data";

interface CatalogProductCardProps {
  product: CatalogProduct;
}

export default function CatalogProductCard({ product }: CatalogProductCardProps) {
  return (
    <li className="group">
      <Link
        href={product.href}
        className="flex h-full flex-col"
        aria-label={product.title}
      >
        <div className="relative aspect-square w-full overflow-hidden rounded-md bg-neutral-100">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <div
              className="h-full w-full bg-neutral-200"
              aria-hidden="true"
            />
          )}
        </div>
        <div className="mt-3 flex flex-col gap-1">
          {product.shopName ? (
            <span className="line-clamp-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
              {product.shopName}
            </span>
          ) : null}
          <span className="line-clamp-2 text-[14px] leading-5 text-neutral-900 transition-colors group-hover:text-neutral-600">
            {product.title}
          </span>
          <span className="mt-0.5 text-[14px] font-semibold text-neutral-900">
            $
            {product.price.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      </Link>
    </li>
  );
}
