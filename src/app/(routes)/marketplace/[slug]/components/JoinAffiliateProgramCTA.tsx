'use client';

import { formatCommissionRate } from '@/lib/marketplace/marketplace';
import type { IMarketplaceListing } from '@/types/interfaces/marketplace/listing';
import Link from 'next/link';

/**
 * "Join the affiliate program" CTA for visitor-publishers.
 *
 * Behaviour:
 *  - When `affiliateProgramId` is set on the listing, link to the agent
 *    onboarding surface (G15 — affiliate-program apply page).
 *  - When the listing is invite-only OR has no program id yet, render
 *    a passive "Invite-only program — contact merchant" message.
 *
 * The actual onboarding form is owned by sibling MARWAN G15 (agent
 * onboarding wizard, not yet on this branch). Until that endpoint
 * exists, the apply route 404s — the listing detail still renders, just
 * the CTA target is a stub. No client crash.
 */
const JoinAffiliateProgramCTA = ({
  listing,
}: {
  listing: IMarketplaceListing;
}) => {
  const inviteOnly = !!listing.isInviteOnly;
  const programId = listing.affiliateProgramId;
  const commissionLabel = formatCommissionRate(listing.commissionRate);
  const merchantName = listing.merchant?.shopName || 'this merchant';
  const merchantSlug = listing.merchant?.shopSlug;

  if (inviteOnly || !programId) {
    return (
      <div
        className="rounded-sm border border-dashed border-secondary p-4 flex flex-col gap-3"
        data-testid="join-affiliate-cta-invite-only"
      >
        <div className="text-sm font-medium">Invite-only program</div>
        <div className="text-xs opacity-70">
          {merchantName}&rsquo;s affiliate program is currently invite-only.
          Reach out to the merchant directly to request an invitation.
        </div>
        {merchantSlug && (
          <Link
            href={`/${encodeURIComponent(merchantSlug)}`}
            className="rounded-sm border border-secondary px-3 py-2 text-sm text-center hover:border-primary-foreground transition-colors"
          >
            Visit merchant storefront
          </Link>
        )}
      </div>
    );
  }

  return (
    <div
      className="rounded-sm border border-secondary p-4 flex flex-col gap-3 bg-secondary/5"
      data-testid="join-affiliate-cta"
    >
      <div className="flex flex-col gap-1">
        <div className="text-sm font-semibold">
          Earn {commissionLabel} on every sale
        </div>
        <div className="text-xs opacity-70">
          Join {merchantName}&rsquo;s affiliate program to start promoting
          this listing.
        </div>
      </div>
      <Link
        href={`/affiliate-programs/${encodeURIComponent(programId)}/apply?listing=${encodeURIComponent(listing.slug || '')}`}
        className="rounded-sm bg-primary-foreground text-background px-4 py-2.5 text-sm font-medium text-center"
        data-testid="join-affiliate-cta-button"
      >
        Join affiliate program
      </Link>
      <div className="text-[10px] uppercase tracking-wide opacity-50 text-center">
        Free to apply · Commission tracked on-chain
      </div>
    </div>
  );
};

export default JoinAffiliateProgramCTA;
