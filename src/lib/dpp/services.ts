/**
 * Public DPP proof client + the confirmed-proof truth condition + the
 * product → gtin/sku/mpn identifier resolver.
 *
 * Ported/adapted from the old Vite storefront's `src/apis/dpp/services.ts`
 * (which used the app axios instance). Next-ShopFront has no shared axios
 * client, so this uses a plain `fetch` against the absolute apiv3 host — the
 * same pattern the SSR structured-data loader uses. The DPP proof endpoint is
 * @Public (no auth / no shop context needed).
 *
 * ENDPOINT NOTE: the strategy memo refers to this read as `dpp/proof/:gtin`,
 * but the LIVE apiv3 route is `v2/dpp/:gtin` (confirmed 2026-07-16 by probing:
 * `GET /dpp/proof/<x>` → route-level 404 "Cannot GET"; `GET /v2/dpp/<x>` →
 * data-level 404 "gtin <x> not found" — i.e. the route exists and only the
 * gtin is unknown). This is the same public Schema F envelope the old Vite
 * shopfront's VerifiedOnchainBadge already consumed. Fail-open makes the path
 * choice non-fatal, but we point at the route that actually resolves.
 *
 * Posture (unchanged from the port):
 *   - Silent-degrade: returns null on ANY non-2xx / network error / bad JSON.
 *     The caller renders NOTHING on null — a stale/unconfirmed "verified" claim
 *     is worse than no badge, and the PDP must never break on a passport miss.
 *   - SSR-safe: never throws, so a server render can call it without a chance
 *     of 500-ing the page (the Phase-1 component calls it client-side, but the
 *     fetcher is agnostic).
 *   - No retry: the BE endpoint is CDN-cached and rate-limited; one request is
 *     enough for the PDP lifetime.
 */

import type { IProduct } from "@/types/interfaces/product/product";
import { isConfirmedChain } from "./chain";
import type { IPublicDppProofEnvelope } from "./interface";

/** Absolute apiv3 host — matches the SSR structured-data loader. */
const APIV3_BASE = "https://apiv3.droplinked.com";

/**
 * Fetch the public DPP proof envelope for a gtin (or sku/mpn — the endpoint
 * resolves any of them by path). Returns null on ANY failure. Never throws.
 */
export async function fetchDppProof(
  identifier: string | null | undefined,
): Promise<IPublicDppProofEnvelope | null> {
  const key = (identifier ?? "").trim();
  if (!key) return null;

  try {
    const res = await fetch(
      `${APIV3_BASE}/v2/dpp/${encodeURIComponent(key)}`,
      {
        headers: { Accept: "application/json" },
        // ISR-friendly if ever called from the server; harmless client-side.
        next: { revalidate: 300 },
      },
    );
    if (!res.ok) return null; // 404 (no passport) / 5xx / etc. → silent-degrade
    const data = (await res.json()) as IPublicDppProofEnvelope;
    return data ?? null;
  } catch {
    // Network / CORS / bad JSON → silent-degrade. Caller renders nothing.
    return null;
  }
}

/**
 * THE truth condition. A passport badge may render ONLY when the envelope
 * represents a CONFIRMED onchain proof:
 *   - BE `verified` flag is true, AND
 *   - there is an onchain anchor with a real attestation UID, AND
 *   - the anchor chain is a confirmed EVM slug (base-mainnet / base-sepolia) —
 *     NEVER `simulated`, AND
 *   - the anchor status (when present) is not PENDING.
 *
 * Anything else — no envelope, verified false/absent, no anchor, simulated
 * chain, pending status — returns false, so the module renders nothing. This
 * is the guard that keeps a badge from ever pointing at a non-existent /
 * unlanded attestation.
 */
export function isConfirmedDppProof(
  env: IPublicDppProofEnvelope | null | undefined,
): env is IPublicDppProofEnvelope {
  if (!env) return false;
  if (env.verified !== true) return false;

  const anchor = env.onchainAnchor;
  if (!anchor) return false;
  if (!anchor.attestationUid) return false;
  if (!isConfirmedChain(anchor.chain)) return false;
  if (anchor.status && anchor.status !== "CONFIRMED") return false;

  return true;
}

/**
 * Resolve the best passport lookup key from a product: gtin first, then a sku
 * code, then an mpn. Returns null when the product carries none — in which case
 * the module renders nothing (POD/long-tail items frequently have no gtin).
 *
 * IProduct does not type these identity fields today, so we read them
 * defensively across the likely locations (product-level and first-sku level,
 * including `recordData`). Every access is guarded and string-trimmed.
 */
export function resolveProductPassportKey(product: IProduct | null | undefined): string | null {
  if (!product) return null;

  const p = product as unknown as Record<string, unknown>;
  const firstSku = (product.skuIDs?.[0] ?? {}) as unknown as Record<string, unknown>;
  const skuRecord = (firstSku.recordData ?? {}) as Record<string, unknown>;

  const pick = (v: unknown): string | null => {
    if (typeof v === "string") {
      const t = v.trim();
      return t.length > 0 ? t : null;
    }
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
    return null;
  };

  // Priority: gtin (barcode) → sku code → mpn.
  return (
    pick(p.gtin) ??
    pick(p.barcode) ??
    pick(skuRecord.gtin) ??
    pick(skuRecord.barcode) ??
    pick(firstSku.gtin) ??
    pick(firstSku.sku) ??
    pick(firstSku.externalID) ??
    pick(p.custome_external_id) ??
    pick(p.mpn) ??
    pick(skuRecord.mpn) ??
    null
  );
}
