import Image from 'next/image';
import Link from 'next/link';
import type { IMarketplaceListing } from '@/types/interfaces/marketplace/listing';

/**
 * Sidebar card showing the merchant who published the listing.
 *
 * Renders nothing when the upstream omitted the `merchant` enrichment
 * (legacy LISTED rows) — the parent decides whether to hide the slot
 * entirely or show a generic "Operated by droplinked merchant" line.
 */
const MerchantInfo = ({ listing }: { listing: IMarketplaceListing }) => {
  const m = listing.merchant;
  if (!m) {
    return (
      <div
        className="rounded-sm border border-secondary p-4 flex flex-col gap-2"
        data-testid="merchant-info-fallback"
      >
        <div className="text-xs uppercase opacity-70">Merchant</div>
        <div className="text-sm">
          Listed by a verified droplinked merchant.
        </div>
      </div>
    );
  }

  const storefrontHref = m.shopSlug ? `/${encodeURIComponent(m.shopSlug)}` : null;

  return (
    <div
      className="rounded-sm border border-secondary p-4 flex flex-col gap-3"
      data-testid="merchant-info"
    >
      <div className="text-xs uppercase opacity-70">Merchant</div>
      <div className="flex items-center gap-3">
        {m.shopLogo ? (
          <div className="relative w-12 h-12 rounded-full overflow-hidden bg-secondary/20 shrink-0">
            <Image
              src={m.shopLogo}
              alt={m.shopName || 'merchant logo'}
              fill
              sizes="48px"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-full bg-secondary/30 shrink-0" />
        )}
        <div className="flex flex-col">
          <div
            className="text-sm font-medium"
            data-testid="merchant-info-name"
          >
            {m.shopName || 'droplinked merchant'}
          </div>
          {m.shopSlug && (
            <div className="text-xs opacity-60">@{m.shopSlug}</div>
          )}
        </div>
      </div>
      {m.shopDescription && (
        <p className="text-xs leading-relaxed opacity-80 line-clamp-4">
          {m.shopDescription}
        </p>
      )}
      {storefrontHref && (
        <Link
          href={storefrontHref}
          className="rounded-sm border border-secondary text-center px-3 py-2 text-sm hover:border-primary-foreground transition-colors"
          data-testid="merchant-info-visit"
        >
          Visit storefront
        </Link>
      )}
    </div>
  );
};

export default MerchantInfo;
