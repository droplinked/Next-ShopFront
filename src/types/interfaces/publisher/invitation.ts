/**
 * Publisher invitation + merchant-branded landing contracts.
 *
 * These types mirror the GET /publisher-invitations/accept/:token preview
 * contract being shipped by sibling MARWAN PR (G2 publisher invitation
 * backend). The preview surface is intentionally narrow — it answers
 * "what is this token, what merchant issued it, what program does it
 * accept, and is the invitee already an AgentProfile?". The acceptance
 * surface is a POST against the same token.
 *
 * Until the G2 backend lands, the api proxy under
 * /api/publisher-invitations/accept/[token] forwards the request and the
 * service maps the upstream payload onto this shape.
 *
 * KEEP THESE FIELDS OPTIONAL where the backend hasn't pinned the schema
 * yet — the landing page degrades gracefully when fields are missing
 * (fallback theme + "details unavailable" copy) rather than crashing.
 */

export interface IPublisherInvitationPreview {
  /** Echoed back from path param so the FE can sanity-check */
  token: string;

  /** Invitation lifecycle state */
  status: InvitationStatus;

  /** When the invitation expires (ISO string). Helpful for countdown UI. */
  expiresAt?: string;

  /** Program preview block — the headline numbers shown on the landing hero */
  program: IPublisherInvitationProgramPreview;

  /** Merchant brand block — drives the whole page theme */
  merchant: IPublisherInvitationMerchantBrand;

  /** Terms preview (collapsed by default on the landing) */
  terms?: IPublisherInvitationTermsPreview;

  /** Whether the recipient email already has an AgentProfile on droplinked. */
  recipient?: IPublisherInvitationRecipient;
}

export type InvitationStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'EXPIRED'
  | 'REVOKED'
  | 'NOT_FOUND';

export interface IPublisherInvitationProgramPreview {
  /** Program display name shown in the hero */
  programName: string;

  /** Commission rate. Either a percentage (0.05 = 5%) or a flat per-sale amount. */
  commissionRate?: number;
  commissionType?: 'PERCENT' | 'FLAT';
  commissionCurrency?: string;

  /** Return / void window in days (how long the merchant has to clawback) */
  returnWindowDays?: number;

  /**
   * Payment terms human label e.g. "Net-15 (USDC, on-chain)".
   * Free-text from the merchant's program config — render as-is.
   */
  paymentTerms?: string;

  /**
   * Onchain attestation. Whether each sale gets an EAS attestation per the
   * MultichainAttestationService stack (PR #1441 / #1444). Shown as a
   * differentiator on the "what you get" feature list.
   */
  attestationEnabled?: boolean;

  /** Settlement asset & rail — e.g. { asset: 'USDC', chain: 'AVAX-C' } */
  settlement?: { asset: string; chain?: string };
}

export interface IPublisherInvitationMerchantBrand {
  /** MongoDB ObjectId of the merchant's shop. Loadbearing for the API path. */
  shopId: string;

  /** Path-segment slug used to reach the shop's storefront */
  shopSlug: string;

  /** Merchant display name — replaces "droplinked" in the hero */
  shopName: string;

  /** Public-CDN URL of the merchant logo. Falls back to a generic icon if absent. */
  logo?: string;

  /** Primary hex colour (e.g. "#179EF8"). Drives CTA + accent colours. */
  primaryColor?: string;

  /** Secondary hex colour. Optional supporting accent. */
  secondaryColor?: string;

  /**
   * Optional font family. If present, applied to the landing inline so it
   * doesn't have to be preloaded at root.
   */
  fontFamily?: string;

  /**
   * Optional custom domain. If the merchant has one, we MAY redirect into
   * https://{customDomain}/publisher rather than the path-based fallback.
   * Phase 1: not used (we always route through shopSlug). Phase 2 will.
   */
  customDomain?: string;
}

export interface IPublisherInvitationTermsPreview {
  /** Merchant T&C document URL (PDF or HTML) */
  url?: string;

  /** Short preview summary — first 200-300 chars of T&Cs */
  summary?: string;

  /** Last revision date — helps the publisher trust the document */
  revisedAt?: string;
}

export interface IPublisherInvitationRecipient {
  /** The invited email (echoed, never PII-sensitive — the merchant issued it) */
  email?: string;

  /**
   * Whether this email is already an AgentProfile on droplinked. Drives the
   * post-accept redirect:
   *   - true  → /[shopSlug]/publisher (existing publisher; show program list)
   *   - false → /publisher-invite/[token]/onboarding (KYB wizard handoff)
   */
  hasAgentProfile: boolean;

  /** AgentProfile ID if already registered. Used to scope the post-accept landing. */
  agentProfileId?: string;
}

/**
 * Response from POST /publisher-invitations/accept/:token.
 *
 * The backend resolves the invitation, atomically attaches the recipient to
 * the merchant's program, and returns whichever next-step path the FE
 * should redirect to.
 */
export interface IPublisherInvitationAcceptResult {
  status: 'ACCEPTED' | 'ALREADY_ACCEPTED' | 'EXPIRED' | 'REVOKED' | 'NOT_FOUND';

  /** Where to redirect the user after acceptance */
  redirectTo: string;

  /**
   * If the recipient was attached to an existing AgentProfile, the program
   * id they were attached to. Useful for analytics + dashboards.
   */
  programId?: string;

  /** Echoed merchant + program brand for the success screen if needed */
  merchant?: IPublisherInvitationMerchantBrand;
  program?: IPublisherInvitationProgramPreview;
}

/**
 * Programs the merchant is running that THIS publisher has joined.
 * Returned by /api/shop/[slug]/public-theme's sibling endpoint
 * /api/publisher/[shopSlug]/programs (Phase-1 still TODO — page is wired to
 * proxy when the backend ships).
 */
export interface IPublisherProgramSummary {
  programId: string;
  programName: string;
  commissionRate?: number;
  commissionType?: 'PERCENT' | 'FLAT';
  commissionCurrency?: string;
  joinedAt?: string;
  recentEarningsUsd?: number;
  dashboardUrl?: string;
}
