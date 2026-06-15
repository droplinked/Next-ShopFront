/**
 * MerchantProductGrid — server-rendered top-8 product grid.
 *
 * Only rendered for verifiedTier === "full".
 * directory_only tier: this component is not mounted.
 *
 * Products are pre-fetched in page.tsx (SSR) and passed as props,
 * so there is no client-side data fetch.
 */

import Image from "next/image";
import type { DiscoveryProduct } from "../lib/discovery-profile";

interface MerchantProductGridProps {
  products: DiscoveryProduct[];
  merchantName: string;
}

export default function MerchantProductGrid({
  products,
  merchantName,
}: MerchantProductGridProps) {
  if (products.length === 0) return null;

  return (
    <section
      className="py-10 px-6 md:px-12 bg-surface"
      aria-label={`${merchantName} top products`}
    >
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold text-ink font-display mb-6">
          Featured Products
        </h2>

        <ul
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
          role="list"
        >
          {products.map((product) => (
            <li key={product.id} className="group">
              <a
                href={product.productUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col gap-2 rounded-md overflow-hidden border border-line bg-surface-1 hover:border-mint-500/40 hover:shadow-card-dark transition-all duration-200"
                aria-label={product.title}
              >
                {/* Product image */}
                <div className="relative w-full aspect-square bg-surface-2">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.title}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      unoptimized={product.imageUrl.startsWith("http")}
                    />
                  ) : (
                    <div
                      className="w-full h-full bg-surface-3"
                      aria-hidden="true"
                    />
                  )}
                </div>

                {/* Product info */}
                <div className="px-3 pb-3 flex flex-col gap-1">
                  <span className="text-sm font-medium text-ink-soft line-clamp-2">
                    {product.title}
                  </span>
                  <span className="text-sm font-semibold text-mint-500">
                    {product.currency}{" "}
                    {product.price.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
