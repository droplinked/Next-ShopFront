/**
 * Pure chain projectors for the DPP passport module.
 *
 * Ported from the old Vite storefront's
 *   src/components/VerifiedOnchainBadge/chainLabel.ts
 * and extended with the confirmed-chain predicate + the Base attestation
 * explorer deep-link ("View on Base").
 *
 * No React / DOM imports — pure functions, safe to run on the server or in a
 * node test.
 *
 * "Base mainnet" / "Base sepolia" are EVM chain identifiers (not partner
 * branding) and are allowed in user-visible strings. `simulated` is the
 * local/dev synthetic anchor and is NEVER a confirmed chain.
 */

import type { DppChainSlug } from "./interface";

/** The only two chain slugs that represent a CONFIRMED onchain anchor. */
const CONFIRMED_CHAINS = new Set<DppChainSlug>(["base-mainnet", "base-sepolia"]);

/**
 * True only for a confirmed EVM anchor. `simulated`, unknown slugs, null, and
 * undefined all return false — the badge must never light on a non-confirmed
 * anchor.
 */
export function isConfirmedChain(chain: DppChainSlug | null | undefined): boolean {
  return !!chain && CONFIRMED_CHAINS.has(chain);
}

/**
 * BE `onchainAnchor.chain` slug → user-visible suffix. Returns null for any
 * non-confirmed chain (keep the generic label; never surface "simulated").
 */
export function chainLabelSuffix(chain: DppChainSlug | null | undefined): string | null {
  if (chain === "base-mainnet") return "Base mainnet";
  if (chain === "base-sepolia") return "Base sepolia";
  return null;
}

/**
 * Build the EAS attestation explorer URL on Base for a confirmed anchor.
 * Returns null when the chain isn't confirmed or the UID is missing — so the
 * "View on Base" affordance only ever renders when it can point at a real,
 * confirmed attestation.
 */
export function buildAttestationUrl(
  chain: DppChainSlug | null | undefined,
  attestationUid: string | null | undefined,
): string | null {
  if (!attestationUid) return null;
  if (chain === "base-mainnet") {
    return `https://base.easscan.org/attestation/view/${attestationUid}`;
  }
  if (chain === "base-sepolia") {
    return `https://base-sepolia.easscan.org/attestation/view/${attestationUid}`;
  }
  return null;
}
