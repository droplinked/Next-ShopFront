import Link from 'next/link';
import type { InvitationStatus } from '@/types/interfaces/publisher/invitation';

interface IInvitationNotFoundProps {
  status: Exclude<InvitationStatus, 'PENDING' | 'ACCEPTED'> | 'UNKNOWN';
  /** Optional merchant name when we recovered partial info from the upstream */
  merchantName?: string;
}

const COPY: Record<IInvitationNotFoundProps['status'], { title: string; body: string }> = {
  NOT_FOUND: {
    title: 'Invitation not found',
    body:
      "We couldn't find an invitation matching this link. Double-check the URL or ask the merchant for a fresh invite.",
  },
  EXPIRED: {
    title: 'Invitation expired',
    body:
      'This invitation has expired. Ask the merchant to issue a new one — your contact details are still on file.',
  },
  REVOKED: {
    title: 'Invitation revoked',
    body:
      'This invitation was withdrawn by the merchant. Please reach out to them directly if you believe this is a mistake.',
  },
  UNKNOWN: {
    title: 'Something went wrong',
    body:
      "We couldn't load this invitation. The merchant may be experiencing an outage — please try again in a moment.",
  },
};

const InvitationNotFound = ({ status, merchantName }: IInvitationNotFoundProps) => {
  const copy = COPY[status];
  return (
    <main className="min-h-[60vh] flex items-center justify-center px-6 py-16 bg-white">
      <div className="max-w-md w-full text-center">
        <p
          className="text-sm font-semibold uppercase tracking-wide"
          style={{ color: 'var(--mt-primary)' }}
        >
          {merchantName ? `${merchantName} affiliate program` : 'Affiliate invitation'}
        </p>
        <h1 className="mt-3 text-3xl md:text-4xl font-bold text-black">
          {copy.title}
        </h1>
        <p className="mt-4 text-base text-black/70 leading-relaxed">{copy.body}</p>
        <div className="mt-8 flex justify-center">
          <Link
            href="https://droplinked.com"
            className="px-6 py-3 rounded-lg font-medium text-sm border border-black/10 hover:bg-black/5 transition"
          >
            Learn about droplinked
          </Link>
        </div>
      </div>
    </main>
  );
};

export default InvitationNotFound;
