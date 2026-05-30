import {
  formatCommissionRate,
  formatListingPrice,
} from '@/lib/marketplace/marketplace';
import type { IMarketplaceListing } from '@/types/interfaces/marketplace/listing';

/**
 * Title + price + commission rate + description block on the detail
 * page. Pure presentation; no client state.
 */
const ListingDetails = ({ listing }: { listing: IMarketplaceListing }) => {
  const price = formatListingPrice(listing.price, listing.currency);
  const commission = formatCommissionRate(listing.commissionRate);

  return (
    <div className="flex flex-col gap-4" data-testid="listing-details">
      <h1
        className="text-2xl sm:text-3xl font-semibold"
        data-testid="listing-details-title"
      >
        {listing.title || 'Untitled listing'}
      </h1>
      <div className="flex flex-wrap items-center gap-3">
        <div
          className="text-xl font-semibold"
          data-testid="listing-details-price"
        >
          {price}
        </div>
        <div
          className="rounded-sm border border-secondary px-3 py-1 text-sm font-medium"
          data-testid="listing-details-commission"
        >
          {commission} commission
        </div>
        {listing.currency && (
          <div
            className="text-xs uppercase opacity-60"
            data-testid="listing-details-currency"
          >
            {listing.currency}
          </div>
        )}
      </div>

      {listing.description && (
        <p
          className="text-sm leading-relaxed opacity-80 whitespace-pre-wrap"
          data-testid="listing-details-description"
        >
          {listing.description}
        </p>
      )}

      {listing.attestationUID && (
        <div className="mt-2 rounded-sm border border-dashed border-secondary p-3 text-xs opacity-70">
          <div className="font-medium uppercase mb-1">
            Onchain attestation
          </div>
          <code className="break-all">{listing.attestationUID}</code>
        </div>
      )}
    </div>
  );
};

export default ListingDetails;
