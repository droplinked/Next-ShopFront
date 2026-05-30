/**
 * Merchant-branded publisher invitation landing.
 *
 * Route: /publisher-invite/[token]
 *
 * Server-rendered. Resolves the invitation preview from the apiv3
 * publisher-invitations backend (sibling MARWAN G2 PR — until that
 * lands, the api proxy 404s gracefully and we render the friendly
 * not-found page).
 *
 * The whole page is themed against the merchant brand (logo, primary
 * colour, secondary colour, name). Phase-1 keeps a tiny "Powered by
 * droplinked" footer. Phase-2 drops it.
 */

import type { Metadata } from 'next';
import {
  getPublisherInvitationPreview,
  getRuntimeOrigin,
} from '@/services/publisher/service';
import {
  resolveMerchantTheme,
  themeAsInlineStyle,
} from '@/lib/merchant-theme/merchant-theme';
import InvitationHero from './components/InvitationHero';
import ProgramHighlights from './components/ProgramHighlights';
import ValueProps from './components/ValueProps';
import TermsPreview from './components/TermsPreview';
import AcceptInvitationCTA from './components/AcceptInvitationCTA';
import PoweredByDroplinkedFooter from './components/PoweredByDroplinkedFooter';
import InvitationNotFound from './components/InvitationNotFound';

type PageProps = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const origin = getRuntimeOrigin();
  const preview = await getPublisherInvitationPreview(token, origin);

  const merchantName = preview?.merchant?.shopName ?? 'a droplinked merchant';
  const programName = preview?.program?.programName ?? 'an affiliate program';
  const title = `${merchantName} — Affiliate invitation`;
  const description = `Join ${merchantName}'s ${programName}. Onchain attribution, USDC payouts, no cookie fraud. Powered by droplinked.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      ...(preview?.merchant?.logo ? { images: [{ url: preview.merchant.logo }] } : {}),
    },
    robots: { index: false, follow: false }, // invitations are private by URL
  };
}

export default async function PublisherInvitePage({ params }: PageProps) {
  const { token } = await params;
  const origin = getRuntimeOrigin();
  const preview = await getPublisherInvitationPreview(token, origin);

  if (!preview || preview.status === 'NOT_FOUND') {
    return (
      <div style={themeAsInlineStyle(resolveMerchantTheme(null))}>
        <InvitationNotFound status="NOT_FOUND" />
      </div>
    );
  }

  if (preview.status === 'EXPIRED' || preview.status === 'REVOKED') {
    const fallbackTheme = resolveMerchantTheme(preview.merchant);
    return (
      <div style={themeAsInlineStyle(fallbackTheme)}>
        <InvitationNotFound
          status={preview.status}
          merchantName={preview.merchant?.shopName}
        />
        <PoweredByDroplinkedFooter />
      </div>
    );
  }

  const theme = resolveMerchantTheme(preview.merchant);
  const inlineStyle = themeAsInlineStyle(theme);

  return (
    <div className="min-h-screen bg-white" style={inlineStyle}>
      <InvitationHero
        theme={theme}
        merchant={preview.merchant}
        program={preview.program}
      />
      <ProgramHighlights program={preview.program} />
      <ValueProps program={preview.program} />
      <TermsPreview terms={preview.terms} merchantName={theme.brandName} />
      <AcceptInvitationCTA
        token={token}
        merchant={preview.merchant}
        recipient={preview.recipient}
      />
      <PoweredByDroplinkedFooter />
    </div>
  );
}
