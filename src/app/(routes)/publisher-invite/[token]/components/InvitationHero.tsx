'use client';

import Image from 'next/image';
import type { IResolvedMerchantTheme } from '@/lib/merchant-theme/merchant-theme';
import type {
  IPublisherInvitationMerchantBrand,
  IPublisherInvitationProgramPreview,
} from '@/types/interfaces/publisher/invitation';

interface IInvitationHeroProps {
  theme: IResolvedMerchantTheme;
  merchant: IPublisherInvitationMerchantBrand;
  program: IPublisherInvitationProgramPreview;
}

const InvitationHero = ({ theme, merchant, program }: IInvitationHeroProps) => {
  const initials = (merchant.shopName || theme.brandName)
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header
      className="w-full px-6 py-14 md:py-20"
      style={{
        backgroundColor: 'var(--mt-primary)',
        color: 'var(--mt-primary-fg)',
      }}
    >
      <div className="max-w-5xl mx-auto flex flex-col gap-8 items-start">
        <div className="flex items-center gap-4">
          {theme.logoUrl ? (
            <Image
              src={theme.logoUrl}
              alt={merchant.shopName || theme.brandName}
              width={56}
              height={56}
              className="h-14 w-14 rounded-lg object-contain bg-white/10"
              unoptimized
            />
          ) : (
            <div className="h-14 w-14 rounded-lg bg-white/15 flex items-center justify-center text-xl font-semibold">
              {initials || 'M'}
            </div>
          )}
          <div>
            <p className="text-sm opacity-80">Affiliate invitation from</p>
            <h2 className="text-2xl font-semibold leading-tight">
              {merchant.shopName || theme.brandName}
            </h2>
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold leading-tight max-w-3xl">
          You&apos;re invited to {program.programName}
        </h1>
        <p className="text-base md:text-lg max-w-2xl opacity-90">
          A merchant-led affiliate program with onchain attestation, fast USDC
          payouts, and a dashboard you can trust.
        </p>
      </div>
    </header>
  );
};

export default InvitationHero;
