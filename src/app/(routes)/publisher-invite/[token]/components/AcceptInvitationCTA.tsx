'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { acceptPublisherInvitation } from '@/services/publisher/service';
import type {
  IPublisherInvitationMerchantBrand,
  IPublisherInvitationRecipient,
} from '@/types/interfaces/publisher/invitation';

interface IAcceptInvitationCTAProps {
  token: string;
  merchant: IPublisherInvitationMerchantBrand;
  recipient?: IPublisherInvitationRecipient;
}

/**
 * The big "Accept Invitation" CTA. On success, redirects based on what the
 * backend returns OR falls back to a sensible client-side default that
 * mirrors the contract:
 *   - if backend says redirectTo, honour it
 *   - else if recipient.hasAgentProfile, route to /[shopSlug]/publisher
 *   - else route to /publisher-invite/[token]/onboarding (KYB wizard handoff)
 */
const AcceptInvitationCTA = ({
  token,
  merchant,
  recipient,
}: IAcceptInvitationCTAProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onAccept = async () => {
    if (loading) return;
    setLoading(true);
    const result = await acceptPublisherInvitation(token);
    if (!result) {
      toast.error("Couldn't accept the invitation. Please try again.");
      setLoading(false);
      return;
    }
    if (result.status === 'EXPIRED' || result.status === 'REVOKED' || result.status === 'NOT_FOUND') {
      toast.error(`Invitation ${result.status.toLowerCase().replace('_', ' ')}.`);
      setLoading(false);
      return;
    }

    let target = result.redirectTo;
    if (!target) {
      if (recipient?.hasAgentProfile && merchant.shopSlug) {
        target = `/${merchant.shopSlug}/publisher`;
      } else {
        target = `/publisher-invite/${encodeURIComponent(token)}/onboarding`;
      }
    }

    toast.success(
      result.status === 'ALREADY_ACCEPTED'
        ? 'Welcome back — taking you to the program.'
        : 'Accepted — welcome aboard.',
    );
    router.push(target);
  };

  return (
    <section className="w-full px-6 py-12 bg-white">
      <div className="max-w-5xl mx-auto flex flex-col items-center gap-4">
        <button
          type="button"
          onClick={onAccept}
          disabled={loading}
          className="w-full md:w-auto px-10 py-4 rounded-lg font-semibold text-base shadow-md transition disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            backgroundColor: 'var(--mt-primary)',
            color: 'var(--mt-primary-fg)',
          }}
        >
          {loading ? 'Accepting…' : 'Accept Invitation'}
        </button>
        <p className="text-xs text-black/50 max-w-md text-center">
          By accepting you agree to {merchant.shopName || 'the merchant'}&apos;s
          program terms and grant droplinked permission to track attributed
          sales on your behalf.
        </p>
      </div>
    </section>
  );
};

export default AcceptInvitationCTA;
