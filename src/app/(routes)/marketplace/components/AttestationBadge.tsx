'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn/cn';
import {
  attestationReasonLabel,
  chainIconSrc,
  chainLabel,
  confirmedChains,
  formatAttestedAt,
  hasConfirmedAttestation,
  truncateHash,
  type IAttestationChainEnvelope,
  type IAttestationChainKey,
  type IProgramAttestation,
} from '@/lib/attestation/attestation';

/**
 * The visual proof-of-onchain-commerce badge.
 *
 * Two variants:
 *  - `variant="compact"` — small chip with checkmark + chain icons. Used
 *                          on listing cards (limited real estate).
 *  - `variant="default"` — full badge with label "Onchain Attested".
 *                          Used on the listing-detail hero. Click opens
 *                          the educational modal with chain links.
 *
 * Both variants render NOTHING when:
 *  - `attestation` is null (no record on file — DRAFT program / flag off)
 *  - neither chain reached `confirmed` status (UID + tx both present)
 *
 * This is deliberate: we never advertise verification we cannot actually
 * deliver. A `pending` attestation is invisible — the badge will appear
 * once the chain indexes the receipt.
 *
 * The standalone verifier landing (`/attestation/:programId`) shows
 * pending + absent states too, so visitors can still see "this program
 * is being attested, indexing in progress".
 */

type AttestationBadgeVariant = 'compact' | 'default';

interface AttestationBadgeProps {
  attestation: IProgramAttestation | null | undefined;
  variant?: AttestationBadgeVariant;
  /**
   * When true (the default), clicking the badge opens an educational
   * modal explaining EAS + DPP and showing chain links. Set false to
   * render a pure visual chip with no click behaviour (e.g. card grid).
   */
  interactive?: boolean;
  className?: string;
}

const AttestationBadge = ({
  attestation,
  variant = 'default',
  interactive = true,
  className,
}: AttestationBadgeProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Cleanly close the modal on Esc; pinned with useCallback so the
  // listener wiring below doesn't re-bind on every render.
  const closeModal = useCallback(() => setIsOpen(false), []);
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', onKey);
    // Lock background scroll while modal is open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, closeModal]);

  if (!hasConfirmedAttestation(attestation)) {
    return null;
  }

  const chains = confirmedChains(attestation);
  const programId = attestation?.programId;
  const programVersion = attestation?.programVersion;

  const handleClick = () => {
    if (!interactive) return;
    setIsOpen(true);
  };

  if (variant === 'compact') {
    return (
      <>
        <button
          type="button"
          onClick={handleClick}
          aria-label={
            interactive
              ? `Onchain attested on ${chains.map(chainLabel).join(' and ')}. Click for details.`
              : `Onchain attested on ${chains.map(chainLabel).join(' and ')}`
          }
          title={`Onchain attested · ${chains.map(chainLabel).join(' + ')}`}
          className={cn(
            'inline-flex items-center gap-1 rounded-sm bg-emerald-500/15',
            'border border-emerald-500/40 px-1.5 py-0.5 text-[10px] font-medium',
            'text-emerald-600 dark:text-emerald-400',
            interactive && 'hover:bg-emerald-500/25 transition-colors cursor-pointer',
            !interactive && 'cursor-default',
            className,
          )}
          data-testid="attestation-badge-compact"
          data-attested-chains={chains.join(',')}
          // Block the parent Link from intercepting the click when the
          // badge is interactive inside a card.
          onMouseDown={(e) => {
            if (interactive) e.stopPropagation();
          }}
        >
          <CheckIcon className="h-2.5 w-2.5" />
          <span aria-hidden="true">Attested</span>
        </button>
        {interactive && isOpen && attestation && (
          <AttestationModal
            attestation={attestation}
            onClose={closeModal}
          />
        )}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label={
          interactive
            ? `Onchain attested on ${chains.map(chainLabel).join(' and ')}. Click for details.`
            : `Onchain attested on ${chains.map(chainLabel).join(' and ')}`
        }
        className={cn(
          'inline-flex items-center gap-2 rounded-sm bg-emerald-500/10',
          'border border-emerald-500/40 px-3 py-1.5 text-sm font-medium',
          'text-emerald-700 dark:text-emerald-300',
          interactive && 'hover:bg-emerald-500/20 transition-colors cursor-pointer',
          !interactive && 'cursor-default',
          className,
        )}
        data-testid="attestation-badge"
        data-attested-chains={chains.join(',')}
      >
        <CheckIcon className="h-3.5 w-3.5" />
        <span>Onchain Attested</span>
        <span className="flex items-center gap-1 ml-1" aria-hidden="true">
          {chains.map((c) => (
            <ChainIcon
              key={c}
              chain={c}
              className="h-4 w-4 rounded-full overflow-hidden"
            />
          ))}
        </span>
        {programVersion && programVersion > 1 && (
          <span
            className="ml-1 rounded-sm bg-emerald-700/20 px-1.5 py-[1px] text-[10px]"
            data-testid="attestation-badge-version"
          >
            v{programVersion}
          </span>
        )}
      </button>
      {interactive && isOpen && attestation && (
        <AttestationModal attestation={attestation} onClose={closeModal} />
      )}
      {/* Hidden link to the standalone verifier landing — improves
          accessibility (visitors using a screen reader can deep-link
          rather than open a modal). */}
      {programId && (
        <Link
          href={`/attestation/${encodeURIComponent(programId)}`}
          className="sr-only"
        >
          View full attestation details
        </Link>
      )}
    </>
  );
};

/* -------------------------------------------------------------------------- */
/*  Modal                                                                     */
/* -------------------------------------------------------------------------- */

const AttestationModal = ({
  attestation,
  onClose,
}: {
  attestation: IProgramAttestation;
  onClose: () => void;
}) => {
  const [copied, setCopied] = useState(false);

  const copySnapshotHash = () => {
    if (!attestation.attestedSnapshotHash) return;
    try {
      navigator.clipboard.writeText(attestation.attestedSnapshotHash);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Best-effort — older browsers without clipboard permissions
      // silently no-op. Visitor can still read the hash visually.
    }
  };

  // The last re-attestation reason (most recent history entry that is
  // NOT the initial publish). Useful context — "this program was
  // re-attested on YYYY-MM-DD because commission rate changed".
  const lastReattestation = (attestation.history || []).find(
    (h) => h.attestedReason && h.attestedReason !== 'INITIAL_PUBLISH',
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="attestation-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => {
        // Close when clicking the backdrop (the outermost div)
        if (e.target === e.currentTarget) onClose();
      }}
      data-testid="attestation-modal"
    >
      <div
        className={cn(
          'relative w-full max-w-lg max-h-[85vh] overflow-y-auto',
          'rounded-sm border border-secondary bg-background',
          'p-6 flex flex-col gap-5',
        )}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close attestation details"
          className="absolute top-3 right-3 rounded-sm p-1 text-sm opacity-70 hover:opacity-100 transition-opacity"
        >
          <CloseIcon className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <CheckIcon className="h-4 w-4 text-emerald-500" />
            <h2
              id="attestation-modal-title"
              className="text-lg font-semibold"
            >
              Onchain Attestation
            </h2>
          </div>
          <p className="text-xs opacity-70">
            This affiliate program&rsquo;s terms are recorded on public
            blockchains. Any party can verify the rules, commission rate,
            and fraud policy without trusting droplinked.
          </p>
        </div>

        {/* Chain rows */}
        <div className="flex flex-col gap-2">
          <ChainRow envelope={attestation.avax} />
          <ChainRow envelope={attestation.base} />
        </div>

        {/* Attestation timestamp */}
        {attestation.attestedAt && (
          <div className="flex flex-col gap-1 text-xs">
            <div className="uppercase opacity-60">Attested at</div>
            <div data-testid="attestation-modal-timestamp">
              {formatAttestedAt(attestation.attestedAt)}
            </div>
          </div>
        )}

        {/* Snapshot hash */}
        {attestation.attestedSnapshotHash && (
          <div className="flex flex-col gap-1 text-xs">
            <div className="uppercase opacity-60">Snapshot hash</div>
            <button
              type="button"
              onClick={copySnapshotHash}
              className="inline-flex items-center gap-2 self-start rounded-sm border border-secondary px-2 py-1 font-mono text-[11px] hover:border-primary-foreground transition-colors"
              title="Click to copy"
              data-testid="attestation-modal-snapshot-hash"
            >
              <span>{truncateHash(attestation.attestedSnapshotHash, 10, 8)}</span>
              <span className="opacity-50 normal-nums">
                {copied ? 'copied' : 'copy'}
              </span>
            </button>
          </div>
        )}

        {/* Last re-attestation reason */}
        {lastReattestation && (
          <div className="flex flex-col gap-1 text-xs">
            <div className="uppercase opacity-60">
              Last re-attestation
            </div>
            <div data-testid="attestation-modal-reattestation">
              {attestationReasonLabel(lastReattestation.attestedReason)}
              {lastReattestation.attestedAt && (
                <>
                  {' '}
                  &middot;{' '}
                  <span className="opacity-70">
                    {formatAttestedAt(lastReattestation.attestedAt)}
                  </span>
                </>
              )}
            </div>
            {lastReattestation.triggerNote && (
              <div className="opacity-60 italic">
                {lastReattestation.triggerNote}
              </div>
            )}
          </div>
        )}

        {/* Verifier landing link */}
        <Link
          href={`/attestation/${encodeURIComponent(attestation.programId)}`}
          className="self-start text-xs underline opacity-70 hover:opacity-100"
          data-testid="attestation-modal-verifier-link"
        >
          View full verifier page &rarr;
        </Link>

        {/* "What is this?" educational */}
        <details className="text-xs">
          <summary className="cursor-pointer opacity-70 hover:opacity-100">
            What is this?
          </summary>
          <div className="mt-2 flex flex-col gap-2 opacity-80 leading-relaxed">
            <p>
              droplinked publishes a tamper-evident snapshot of each
              affiliate program&rsquo;s rules to the{' '}
              <a
                href="https://attest.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Ethereum Attestation Service
              </a>{' '}
              (EAS) on two chains.
            </p>
            <p>
              Each attestation includes the commission rate, fraud
              policy, and termination terms. When a merchant changes
              these, a new attestation is recorded automatically — the
              history of changes is auditable on-chain.
            </p>
            <p>
              This is the Digital Product Passport (DPP) layer for
              affiliate commerce: publishers and customers can verify
              the program they joined hasn&rsquo;t silently changed
              under them.
            </p>
          </div>
        </details>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Chain row inside the modal                                                */
/* -------------------------------------------------------------------------- */

const ChainRow = ({
  envelope,
}: {
  envelope: IAttestationChainEnvelope | null | undefined;
}) => {
  if (!envelope || envelope.status === 'absent') {
    // Hide absent chains in the modal — the badge only renders for
    // confirmed-at-all attestations, so showing "absent" rows here is
    // visual noise. The standalone verifier landing shows them.
    return null;
  }

  const isConfirmed = envelope.status === 'confirmed';
  const chainName = chainLabel(envelope.chain);

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-sm border p-3',
        isConfirmed
          ? 'border-emerald-500/40 bg-emerald-500/5'
          : 'border-secondary bg-secondary/5',
      )}
      data-testid={`attestation-modal-chain-${envelope.chain.toLowerCase()}`}
    >
      <div className="flex items-center gap-2 text-sm">
        <ChainIcon chain={envelope.chain} className="h-5 w-5" />
        <span className="font-medium">{chainName}</span>
        <span
          className={cn(
            'rounded-sm px-1.5 py-[1px] text-[10px] uppercase',
            isConfirmed
              ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
              : 'bg-amber-500/20 text-amber-700 dark:text-amber-300',
          )}
        >
          {envelope.status}
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        {envelope.explorerUrl && (
          <a
            href={envelope.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline opacity-80 hover:opacity-100"
            data-testid={`attestation-modal-explorer-${envelope.chain.toLowerCase()}`}
          >
            Explorer
          </a>
        )}
        {envelope.easUrl && (
          <a
            href={envelope.easUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline opacity-80 hover:opacity-100"
            data-testid={`attestation-modal-eas-${envelope.chain.toLowerCase()}`}
          >
            EAS
          </a>
        )}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Icons (inline SVG — no extra deps, no Image-priority overhead)            */
/* -------------------------------------------------------------------------- */

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

const CloseIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
    className={className}
  >
    <path
      d="M4 4l8 8M12 4l-8 8"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * Chain logo — SVG-first with a text-initial fallback if /public assets
 * aren't shipped yet. Kept inline to dodge layout shift; the asset
 * source resolves via chainIconSrc() so a rebrand only touches the lib.
 *
 * In practice the /public/images/chains/{avax,base}.svg files may not
 * exist on day 1 — the styled-initial fallback below means a missing
 * file degrades to a colored capsule rather than a broken-image icon.
 */
const ChainIcon = ({
  chain,
  className,
}: {
  chain: IAttestationChainKey;
  className?: string;
}) => {
  const [errored, setErrored] = useState(false);
  if (errored) {
    return (
      <span
        aria-label={chainLabel(chain)}
        title={chainLabel(chain)}
        className={cn(
          'inline-flex items-center justify-center rounded-full text-[8px] font-bold',
          chain === 'AVAX'
            ? 'bg-red-500/20 text-red-700 dark:text-red-300'
            : 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
          className,
        )}
      >
        {chain === 'AVAX' ? 'AV' : 'BA'}
      </span>
    );
  }
  return (
    // Using <img> instead of next/image so SSR rendering the badge
    // doesn't require the next.config.mjs remotePatterns dance for what
    // is a local /public asset. Plain img + error fallback keeps the
    // failure mode visible (colored initial) rather than a 1x1 ghost.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={chainIconSrc(chain)}
      alt={chainLabel(chain)}
      className={className}
      onError={() => setErrored(true)}
    />
  );
};

export default AttestationBadge;
