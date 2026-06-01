/**
 * /attestation/[programId] — public verifier landing.
 *
 * Standalone page where ANY party (publishers, customers, investors,
 * regulators) can verify a droplinked affiliate program's onchain
 * attestation without needing a droplinked account.
 *
 * SSR-fetches the full envelope so:
 *   - the URL is shareable + crawlable with real verification data
 *   - chain links + snapshot hash appear before any JS runs
 *   - search engines see the full content for indexing
 *
 * Renders three states:
 *   1) Found + confirmed → full verifier with chain rows, history,
 *      explorer + EAS scanner links, copyable snapshot hash, JSON-LD.
 *   2) Found + no attestation yet → "no on-chain attestation yet"
 *      empty state (DRAFT program OR feature flag OFF).
 *   3) Not found → 404-flavored friendly fallback.
 *
 * Embeddable: `?embed=true` strips the AppLayout-style chrome (header
 * + footer aren't actually rendered on this route — see chrome note
 * below). The `embed` param mainly hides the back-link + page-level
 * margins so the iframe payload is tight.
 *
 * SEO:
 *   - <title>: Verified onchain — {programName}
 *   - meta description: chain coverage + last attestation date
 *   - JSON-LD: Schema.org WebPage with Action linking to the EAS
 *     scanner. Lets search engines and AI crawlers discover the
 *     verification context.
 *   - The marketplace sitemap does NOT include /attestation/* yet
 *     (intentional — programId-keyed URLs are reached via the
 *     marketplace listing pages; sitemap noise is unhelpful).
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn/cn';
import { app_vertical } from '@/lib/variables/variables';
import {
  attestationReasonLabel,
  chainIconSrc,
  chainLabel,
  confirmedChains,
  formatAttestedAt,
  hasAnyAttestationActivity,
  hasConfirmedAttestation,
  truncateHash,
  type IAttestationChainEnvelope,
  type IProgramAttestation,
} from '@/lib/attestation/attestation';
import { getProgramAttestation } from '@/services/attestation/service';

export const dynamic = 'force-dynamic';

type RouteParams = { programId: string };
type SearchParamShape = Record<string, string | string[] | undefined>;

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { programId } = await params;
  const attestation = await getProgramAttestation(programId);

  if (!attestation) {
    return {
      title: 'Attestation not found — droplinked',
      description:
        'No onchain attestation is available for this affiliate program.',
      robots: { index: false, follow: false },
    };
  }

  const chains = confirmedChains(attestation).map(chainLabel);
  const chainCopy = chains.length > 0 ? chains.join(' + ') : 'pending';
  const lastAttestedAt = attestation.attestedAt
    ? formatAttestedAt(attestation.attestedAt)
    : 'not yet attested';
  const title = `Verified onchain · Program ${truncateHash(attestation.programId, 6, 4)} — droplinked`;
  const description = `Onchain attestation for droplinked affiliate program ${truncateHash(attestation.programId, 6, 4)}. Chains: ${chainCopy}. Last attested: ${lastAttestedAt}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    // No /attestation noise in the sitemap; per-program attestation
    // pages are deep-linked from the marketplace, not crawled directly.
    robots: hasConfirmedAttestation(attestation)
      ? { index: true, follow: true }
      : { index: false, follow: false },
  };
}

export default async function ProgramAttestationVerifierPage({
  params,
  searchParams,
}: {
  params: Promise<RouteParams>;
  searchParams: Promise<SearchParamShape>;
}) {
  const { programId } = await params;
  const search = await searchParams;
  const isEmbed =
    search.embed === 'true' ||
    search.embed === '1' ||
    (Array.isArray(search.embed) && search.embed.includes('true'));

  const attestation = await getProgramAttestation(programId);

  if (!attestation) {
    // Treat invalid + missing the same way visually — friendly empty
    // state, no 500. The metadata above flags the page noindex.
    return (
      <main
        className={cn(
          'container mt-20 mb-20 gap-6',
          app_vertical,
          isEmbed && 'mt-6 mb-6',
        )}
        data-testid="attestation-page-not-found"
      >
        <h1 className="text-2xl font-semibold">Attestation not found</h1>
        <p className="text-sm opacity-70 max-w-md text-center">
          No onchain attestation is available for the program{' '}
          <code className="text-xs">{truncateHash(programId, 6, 4)}</code>.
          The program may not exist, may be in DRAFT, or attestation
          publishing may be temporarily paused.
        </p>
        {!isEmbed && (
          <Link
            href="/marketplace"
            className="rounded-sm border border-secondary px-4 py-2 text-sm hover:border-primary-foreground transition-colors"
          >
            Browse marketplace
          </Link>
        )}
      </main>
    );
  }

  const hasActivity = hasAnyAttestationActivity(attestation);
  const isConfirmed = hasConfirmedAttestation(attestation);
  const chains = confirmedChains(attestation);
  const jsonLd = buildJsonLd(attestation);

  return (
    <main
      className={cn(
        'container mt-20 mb-20 w-full',
        app_vertical,
        'gap-8',
        isEmbed && 'mt-6 mb-6',
      )}
      data-testid="attestation-page"
    >
      {/* JSON-LD structured data — discovery layer for search + AI crawlers */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        data-testid="attestation-page-jsonld"
      />

      {!isEmbed && (
        <nav
          aria-label="Breadcrumb"
          className="w-full max-w-3xl text-xs opacity-70 flex items-center gap-2"
        >
          <Link href="/marketplace" className="hover:underline">
            Marketplace
          </Link>
          <span>/</span>
          <span>Attestation</span>
        </nav>
      )}

      <header className="flex flex-col items-center gap-3 w-full max-w-3xl">
        <div
          className={cn(
            'inline-flex items-center gap-2 rounded-sm px-3 py-1 text-xs font-medium uppercase',
            isConfirmed
              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40'
              : hasActivity
                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/40'
                : 'bg-secondary/20 text-foreground border border-secondary',
          )}
          data-testid="attestation-page-status-pill"
        >
          {isConfirmed
            ? 'Onchain Attested'
            : hasActivity
              ? 'Indexing on-chain'
              : 'Not yet attested'}
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-center">
          {isConfirmed ? 'Verified onchain' : 'Attestation status'}
        </h1>
        <p className="text-sm opacity-70 text-center max-w-md">
          This page renders the live, public attestation pointer for an
          affiliate program. Every party can verify the program&rsquo;s
          terms haven&rsquo;t silently changed by inspecting the chains
          below.
        </p>
        <div className="text-xs opacity-60 font-mono">
          program{' '}
          <span data-testid="attestation-page-program-id">
            {attestation.programId}
          </span>
        </div>
      </header>

      <section
        className="w-full max-w-3xl flex flex-col gap-4"
        aria-label="Chain attestation rows"
      >
        <FullChainRow envelope={attestation.avax} />
        <FullChainRow envelope={attestation.base} />
      </section>

      <section className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-2 gap-4">
        {attestation.attestedAt && (
          <DetailCell label="Attested at" testId="attestation-page-attested-at">
            {formatAttestedAt(attestation.attestedAt)}
          </DetailCell>
        )}
        {attestation.programVersion && (
          <DetailCell
            label="Program version"
            testId="attestation-page-program-version"
          >
            v{attestation.programVersion}
          </DetailCell>
        )}
        {attestation.attestedSnapshotHash && (
          <DetailCell
            label="Snapshot hash"
            testId="attestation-page-snapshot-hash"
            mono
          >
            {truncateHash(attestation.attestedSnapshotHash, 10, 8)}
          </DetailCell>
        )}
        {attestation.schemaUid && (
          <DetailCell
            label="EAS schema UID"
            testId="attestation-page-schema-uid"
            mono
          >
            {truncateHash(attestation.schemaUid, 10, 8)}
          </DetailCell>
        )}
        {chains.length > 0 && (
          <DetailCell
            label="Verified on"
            testId="attestation-page-chain-list"
          >
            {chains.map(chainLabel).join(' + ')}
          </DetailCell>
        )}
        {attestation.status && (
          <DetailCell
            label="Program status"
            testId="attestation-page-program-status"
          >
            {attestation.status}
          </DetailCell>
        )}
      </section>

      {attestation.history && attestation.history.length > 0 && (
        <section
          className="w-full max-w-3xl flex flex-col gap-3"
          aria-label="Attestation history"
          data-testid="attestation-page-history"
        >
          <h2 className="text-lg font-semibold">History</h2>
          <ol className="flex flex-col gap-3">
            {attestation.history.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-col gap-1 rounded-sm border border-secondary p-3 text-xs"
                data-testid="attestation-page-history-entry"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">
                    {attestationReasonLabel(entry.attestedReason)}
                  </span>
                  <span className="opacity-60">
                    {entry.attestedAt && formatAttestedAt(entry.attestedAt)}
                  </span>
                </div>
                {entry.triggerNote && (
                  <p className="opacity-70 italic">{entry.triggerNote}</p>
                )}
                <div className="flex flex-wrap gap-3 mt-1">
                  {entry.avax?.explorerUrl && (
                    <a
                      href={entry.avax.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline opacity-80 hover:opacity-100"
                    >
                      Avalanche tx
                    </a>
                  )}
                  {entry.avax?.easUrl && (
                    <a
                      href={entry.avax.easUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline opacity-80 hover:opacity-100"
                    >
                      Avalanche EAS
                    </a>
                  )}
                  {entry.base?.explorerUrl && (
                    <a
                      href={entry.base.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline opacity-80 hover:opacity-100"
                    >
                      Base tx
                    </a>
                  )}
                  {entry.base?.easUrl && (
                    <a
                      href={entry.base.easUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline opacity-80 hover:opacity-100"
                    >
                      Base EAS
                    </a>
                  )}
                  <span className="opacity-50 font-mono">
                    snapshot {truncateHash(entry.snapshotHash, 6, 4)}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {!isEmbed && (
        <section className="w-full max-w-3xl flex flex-col gap-2 text-xs opacity-80 leading-relaxed">
          <h2 className="text-sm font-semibold uppercase opacity-100">
            What does this mean?
          </h2>
          <p>
            droplinked publishes a tamper-evident snapshot of each
            affiliate program to the{' '}
            <a
              href="https://attest.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Ethereum Attestation Service
            </a>{' '}
            (EAS) on Avalanche and Base. When a merchant changes
            commission, fraud, or termination terms, a new attestation is
            recorded automatically — building an auditable history.
          </p>
          <p>
            Publishers can verify the program they joined hasn&rsquo;t
            silently changed. Customers can verify the commission rate
            their referrer is being paid. Regulators can audit material
            changes over time. All without a droplinked account.
          </p>
          <p className="opacity-70">
            This is the Digital Product Passport (DPP) layer for
            affiliate commerce.
          </p>
        </section>
      )}

      {!isEmbed && (
        <div className="text-xs opacity-60">
          <Link
            href="/marketplace"
            className="underline hover:opacity-100"
          >
            ← Back to marketplace
          </Link>
        </div>
      )}
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page sub-components                                                       */
/* -------------------------------------------------------------------------- */

const FullChainRow = ({
  envelope,
}: {
  envelope: IAttestationChainEnvelope | null | undefined;
}) => {
  if (!envelope) return null;
  const isConfirmed = envelope.status === 'confirmed';
  const isPending = envelope.status === 'pending';
  const isAbsent = envelope.status === 'absent';

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 rounded-sm border p-4',
        isConfirmed && 'border-emerald-500/40 bg-emerald-500/5',
        isPending && 'border-amber-500/40 bg-amber-500/5',
        isAbsent && 'border-dashed border-secondary bg-secondary/5',
      )}
      data-testid={`attestation-page-chain-${envelope.chain.toLowerCase()}`}
      data-chain-status={envelope.status}
    >
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={chainIconSrc(envelope.chain)}
          alt=""
          aria-hidden="true"
          className="h-7 w-7"
          onError={(e) => {
            // Fallback to initials if asset missing — graceful degrade
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
        <div className="flex flex-col">
          <div className="text-sm font-medium">
            {chainLabel(envelope.chain)}
          </div>
          <div className="text-[10px] uppercase opacity-60">
            {envelope.status}
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 text-xs">
        {envelope.attestationUid && (
          <div
            className="font-mono opacity-70"
            data-testid={`attestation-page-uid-${envelope.chain.toLowerCase()}`}
          >
            UID {truncateHash(envelope.attestationUid, 6, 4)}
          </div>
        )}
        <div className="flex flex-wrap gap-2 justify-end">
          {envelope.explorerUrl && (
            <a
              href={envelope.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline opacity-80 hover:opacity-100"
              data-testid={`attestation-page-explorer-${envelope.chain.toLowerCase()}`}
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
              data-testid={`attestation-page-eas-${envelope.chain.toLowerCase()}`}
            >
              EAS scanner
            </a>
          )}
          {isAbsent && (
            <span className="opacity-50">No record on this chain yet</span>
          )}
        </div>
      </div>
    </div>
  );
};

const DetailCell = ({
  label,
  children,
  testId,
  mono,
}: {
  label: string;
  children: React.ReactNode;
  testId?: string;
  mono?: boolean;
}) => (
  <div className="flex flex-col gap-1 rounded-sm border border-secondary p-3">
    <div className="text-[10px] uppercase opacity-60">{label}</div>
    <div className={cn('text-sm', mono && 'font-mono')} data-testid={testId}>
      {children}
    </div>
  </div>
);

/* -------------------------------------------------------------------------- */
/*  JSON-LD                                                                   */
/* -------------------------------------------------------------------------- */

function buildJsonLd(attestation: IProgramAttestation | null) {
  if (!attestation) return {};
  const chains = confirmedChains(attestation);
  const easUrls = [attestation.avax?.easUrl, attestation.base?.easUrl].filter(
    (s): s is string => typeof s === 'string' && s.length > 0,
  );
  const attestedAt =
    attestation.attestedAt instanceof Date
      ? attestation.attestedAt.toISOString()
      : attestation.attestedAt || undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `Onchain attestation — droplinked affiliate program ${attestation.programId}`,
    description: `EAS attestation for droplinked affiliate program ${attestation.programId} on ${chains.map(chainLabel).join(' and ') || 'pending chains'}.`,
    dateModified: attestedAt,
    sameAs: easUrls,
    publisher: {
      '@type': 'Organization',
      name: 'droplinked',
      url: 'https://droplinked.com',
    },
    // A potential "verify on chain" action surfaced to AI crawlers
    potentialAction: easUrls.length
      ? {
          '@type': 'ViewAction',
          name: 'Verify on EAS',
          target: easUrls[0],
        }
      : undefined,
  };
}

