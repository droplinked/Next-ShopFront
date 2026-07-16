/**
 * Public DPP (Digital Product Passport) proof envelope returned by
 *   GET https://apiv3.droplinked.com/dpp/proof/:gtin   (live, @Public, no auth)
 *
 * Ported from the old Vite storefront's `src/apis/dpp/interface.ts`
 * (droplinked-shopfront, Schema F public envelope) and EXTENDED with the
 * canonical passport-presentation fields the premium PDP panel renders
 * (manufacturer / country of origin / composition / spec / lifecycle).
 *
 * Every field is defensively OPTIONAL: the BE envelope shape is treated as
 * untrusted input. The module keys its render decision off the confirmed
 * onchain-anchor + `verified` flag (see `isConfirmedDppProof`), and the panel
 * renders only the presentation fields that are actually present — so an
 * envelope that omits, renames, or nests any field degrades gracefully to a
 * smaller panel rather than a crash.
 *
 * Truth-condition note: the two BE-blessed CONFIRMED EVM slugs are
 * `base-mainnet` / `base-sepolia`. `simulated` is the local/dev synthetic
 * anchor and MUST NEVER light the badge (see chain.ts + services.ts). Given
 * the batched-writer gas-stub history (minted rows that never landed onchain),
 * a PENDING/simulated anchor is explicitly not a confirmed proof.
 */

/** BE onchain-anchor chain slug. Only the two EVM slugs are "confirmed". */
export type DppChainSlug = "base-mainnet" | "base-sepolia" | "simulated" | (string & {});

/** A single lifecycle timeline entry (created / anchored / imported / ...). */
export interface IDppLifecycleEvent {
  /** Human label, e.g. "Manufactured", "Anchored onchain". */
  label: string;
  /** ISO date string; optional. */
  date?: string;
  /** Optional place/context, e.g. a country or facility. */
  location?: string;
}

/** Canonical passport presentation fields (ESPR-aligned). All optional. */
export interface IDppPassportFields {
  manufacturer?: string;
  countryOfOrigin?: string;
  composition?: string;
  /** Frozen canonical spec summary (free text). */
  spec?: string;
  lifecycle?: IDppLifecycleEvent[];
}

/** Onchain anchor metadata for the confirmed-proof gate + "View on Base" link. */
export interface IDppOnchainAnchor {
  chain: DppChainSlug;
  attestationUid: string;
  batchPeriod?: string;
  merkleRoot?: string;
  recordCount?: number;
  /** Optional confirmation status; anything other than CONFIRMED is not shown. */
  status?: "CONFIRMED" | "PENDING" | (string & {});
}

/**
 * The public DPP proof envelope. Fields the badge/panel consume are typed;
 * unknown extra fields (frozenFields, merkleProof, proofLengthBytes, …) are
 * ignored — independent verifiers read those, the customer-facing panel does
 * not.
 */
export interface IPublicDppProofEnvelope {
  gtin?: string;
  sku?: string;
  schema?: string;
  /** null/absent = no onchain anchor → not a confirmed proof. */
  onchainAnchor?: IDppOnchainAnchor | null;
  leafHash?: string;
  /** BE's own verification flag — must be true for a confirmed proof. */
  verified?: boolean;
  /** Published DPP timestamp; part of the "published + confirmed anchor" gate. */
  publishedAt?: string | null;

  /**
   * Passport presentation fields. The BE may return these flat on the envelope
   * OR nested under `passport`; the panel reads both (see ProductPassport).
   */
  passport?: IDppPassportFields;

  /**
   * Manufacturer-vouch (brand-attestation MINTED) tier — the STRONGER
   * "Verified by {manufacturer}" label. Only used when explicitly confirmed;
   * absent → the panel uses the "Onchain product passport" label.
   */
  manufacturer?: string;
  manufacturerVerified?: boolean;
}
