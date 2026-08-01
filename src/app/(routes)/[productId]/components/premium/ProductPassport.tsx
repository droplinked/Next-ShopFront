'use client';

/**
 * ProductPassport — the conditional onchain-authenticity module for the
 * premium PDP's reserved authenticity slot (below the CTA in PremiumDetails).
 *
 * Phase 1 of the product-passport strategy (2026-07-16): port the old Vite
 * storefront's onchain-authenticity primitives (VerifiedOnchainBadge /
 * VerifiedBrandBadge / apis/dpp) into Next-ShopFront, rendered CONDITIONALLY
 * and read-only.
 *
 * Behaviour contract:
 *   - Flag-gated by NEXT_PUBLIC_PDP_PASSPORT_ENABLED. OFF → returns null before
 *     any fetch fires (zero side-effects during the dark-launch window).
 *   - Keys off the product's gtin (fallback sku/mpn). No key → renders nothing.
 *   - Renders the badge ONLY on a CONFIRMED onchain DPP proof
 *     (isConfirmedDppProof). Pending / simulated / unverified → nothing.
 *   - Fail-open: any fetch error → renders nothing, never breaks the PDP. The
 *     fetch is client-side (this is a client island), so it can never 500 the
 *     SSR render either.
 *   - Read-only. NO wallet gate.
 *
 * Copy discipline (POD items): "onchain product passport", "provenance",
 * "proof of purchase" — never "you own this onchain".
 */

import { useEffect, useState } from 'react';
import { PDP_PASSPORT_ENABLED } from '@/lib/variables/variables';
import type { IProduct } from '@/types/interfaces/product/product';
import { buildAttestationUrl, chainLabelSuffix } from '@/lib/dpp/chain';
import type { IDppPassportFields, IPublicDppProofEnvelope } from '@/lib/dpp/interface';
import {
  fetchDppProof,
  isConfirmedDppProof,
  resolveProductPassportKey,
} from '@/lib/dpp/services';

function ShieldCheck() {
  return (
    <svg
      aria-hidden="true"
      width={13}
      height={13}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 1.5l5 2v3.5c0 3-2.1 5.4-5 6.5-2.9-1.1-5-3.5-5-6.5V3.5l5-2z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M5.8 8l1.6 1.6L10.4 6.6"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Merge passport presentation fields (nested `passport` OR flat on envelope). */
function mergedFields(env: IPublicDppProofEnvelope): IDppPassportFields & { manufacturer?: string } {
  const nested = env.passport ?? {};
  return {
    manufacturer: nested.manufacturer ?? env.manufacturer,
    countryOfOrigin: nested.countryOfOrigin,
    composition: nested.composition,
    spec: nested.spec,
    lifecycle: nested.lifecycle,
  };
}

export default function ProductPassport({ product }: { product: IProduct }) {
  const [env, setEnv] = useState<IPublicDppProofEnvelope | null>(null);
  const [open, setOpen] = useState(false);

  // Dark-launch gate — resolved at module init (NEXT_PUBLIC_ is inlined).
  const flagOn = PDP_PASSPORT_ENABLED;
  const key = flagOn ? resolveProductPassportKey(product) : null;

  useEffect(() => {
    if (!flagOn || !key) return;
    let cancelled = false;
    (async () => {
      const proof = await fetchDppProof(key);
      if (cancelled) return;
      // Only keep a CONFIRMED proof; anything else stays null → renders nothing.
      setEnv(isConfirmedDppProof(proof) ? proof : null);
    })();
    return () => {
      cancelled = true;
    };
  }, [flagOn, key]);

  // Absolute gate: nothing unless flag on + key present + a CONFIRMED proof.
  if (!flagOn || !key) return null;
  if (!isConfirmedDppProof(env)) return null;

  const anchor = env.onchainAnchor!;
  const fields = mergedFields(env);
  const attestationUrl = buildAttestationUrl(anchor.chain, anchor.attestationUid);
  const chainSuffix = chainLabelSuffix(anchor.chain);

  // Two-tier label: manufacturer-vouch (stronger) vs. published DPP.
  const manufacturerVouched = env.manufacturerVerified === true && !!fields.manufacturer;
  const badgeLabel = manufacturerVouched
    ? `Verified by ${fields.manufacturer}`
    : 'Onchain product passport';

  const rows: Array<{ label: string; value: string }> = [];
  if (fields.manufacturer) rows.push({ label: 'Manufacturer', value: fields.manufacturer });
  if (fields.countryOfOrigin)
    rows.push({ label: 'Country of origin', value: fields.countryOfOrigin });
  if (fields.composition) rows.push({ label: 'Composition', value: fields.composition });
  if (fields.spec) rows.push({ label: 'Specification', value: fields.spec });

  const lifecycle = Array.isArray(fields.lifecycle) ? fields.lifecycle : [];

  return (
    <div className="mt-6" data-testid="pdp-product-passport">
      {/* Quiet badge — the presence of this on some products and not others is
          the signal. Tap to open the passport panel. */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="pdp-passport-panel"
        className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-[12px] font-medium text-neutral-700 transition-colors hover:border-neutral-900 hover:text-neutral-900"
      >
        <span className="text-neutral-900">
          <ShieldCheck />
        </span>
        <span>{badgeLabel}</span>
        <span className="text-neutral-400">{open ? '−' : '+'}</span>
      </button>

      {open && (
        <div
          id="pdp-passport-panel"
          role="region"
          aria-label="Product passport"
          className="mt-3 rounded-md border border-neutral-200 bg-neutral-50 p-4 text-[13px] leading-6 text-neutral-600"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
            {manufacturerVouched
              ? 'Manufacturer-verified passport'
              : 'Onchain product passport'}
          </p>

          {rows.length > 0 && (
            <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
              {rows.map((r) => (
                <div key={r.label} className="flex flex-col">
                  <dt className="text-[11px] uppercase tracking-wide text-neutral-400">
                    {r.label}
                  </dt>
                  <dd className="text-[13px] text-neutral-800">{r.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {lifecycle.length > 0 && (
            <div className="mt-4">
              <p className="text-[11px] uppercase tracking-wide text-neutral-400">Lifecycle</p>
              <ol className="mt-2 flex flex-col gap-1.5">
                {lifecycle.map((ev, i) => (
                  <li key={`${ev.label}-${i}`} className="flex items-baseline gap-2">
                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-neutral-400" />
                    <span className="text-[13px] text-neutral-700">{ev.label}</span>
                    {ev.date && (
                      <span className="text-[12px] text-neutral-400">{ev.date}</span>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}

          <p className="mt-4 text-[12px] leading-5 text-neutral-500">
            A provenance record for this item, anchored onchain{chainSuffix ? ` on ${chainSuffix}` : ''}.
            When you purchase, it links to your proof of purchase.
          </p>

          {attestationUrl && (
            <a
              href={attestationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-neutral-900 underline underline-offset-2 hover:text-neutral-600"
            >
              View on Base
              <span aria-hidden>↗</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
}
