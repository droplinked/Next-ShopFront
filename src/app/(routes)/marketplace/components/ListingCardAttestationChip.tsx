'use client';

import { cn } from '@/lib/utils/cn/cn';
import type { IMarketplaceListing } from '@/types/interfaces/marketplace/listing';

/**
 * Card-level attestation chip — icon-only badge with a tooltip on hover.
 *
 * The card grid renders DOZENS of listings per page, so fetching a
 * per-card program attestation would N+1 the discovery endpoint. We
 * use the cheap heuristic: the listing payload already carries
 * `attestationUID` (product-level, populated by sibling MARWAN
 * PR #1441 multichain-attestation arch). When that field is present,
 * we render the chip; the FULL attestation envelope + chain links live
 * on the detail page where one extra fetch is acceptable.
 *
 * Rendering rules:
 *   - `attestationUID` present  → chip renders (product is attested)
 *   - `attestationUID` missing  → chip renders nothing (no signal)
 *
 * NOT interactive — the whole card is wrapped in a Next link, so any
 * click target inside the card needs to be either non-interactive or
 * stopPropagation()-shielded. The detail-page badge variant handles
 * the click affordance (modal). This chip is pure visual signal.
 */
const ListingCardAttestationChip = ({
  listing,
}: {
  listing: IMarketplaceListing;
}) => {
  const isAttested =
    typeof listing.attestationUID === 'string' &&
    listing.attestationUID.length > 0;

  if (!isAttested) return null;

  return (
    <div
      className={cn(
        'absolute top-2 left-2 inline-flex items-center gap-1',
        'rounded-sm bg-emerald-500/90 px-1.5 py-0.5',
        'text-[10px] font-medium text-white',
        'shadow-sm pointer-events-none',
      )}
      role="img"
      aria-label="Onchain attested"
      title="Onchain attested — verify on detail page"
      data-testid="marketplace-listing-attestation-chip"
    >
      <CheckIcon className="h-2.5 w-2.5" />
      <span>Attested</span>
    </div>
  );
};

const CheckIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
    className={className}
  >
    <path
      d="M3 8.5l3.5 3.5L13 4.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default ListingCardAttestationChip;
