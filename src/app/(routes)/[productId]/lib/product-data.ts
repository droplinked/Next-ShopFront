/**
 * product-data.ts
 *
 * SSR data source for the INTERACTIVE product page served at
 *   shop.droplinked.com/<productId>
 *
 * WHY THIS EXISTS (the "Buy Now" black-screen fix)
 * ------------------------------------------------
 * The interactive PDP was written for a SINGLE-SHOP storefront: page.tsx called
 * `fetchInstance('products/:id')`, which requires a per-shop x-shop-id
 * (NEXT_PUBLIC_API_KEY). The aggregate root storefront (shop.droplinked.com) is
 * CROSS-SHOP and has no single shop identity, so NEXT_PUBLIC_API_KEY is unset
 * and `fetchInstance` throws "Unauthorized!" *before it even makes a request*
 * (see fetchInstance.ts: `if (!API_KEY) throw`). page.tsx is a Server Component
 * with no try/catch, so that throw took down the whole route → Next's default
 * error page ("Application error: a client-side exception has occurred").
 *
 * On top of that, imported/aggregate products (e.g. from the Shopify merchant
 * "theshoecircle") only exist behind the PUBLIC product-v2 endpoint, whose
 * payload is the V2 shape (`skuIds` / `skus` / `type` / `isPurchasable` /
 * `images` / `shop`), NOT the legacy V1 shape (`skuIDs` / `product_type` /
 * `purchaseAvailable` / `media`) the interactive client subtree consumes — so
 * even a successful fetch would null-deref during hydration.
 *
 * This loader NEVER throws:
 *   1. Try the legacy shop-scoped endpoint — unchanged behavior on single-shop
 *      deployments where NEXT_PUBLIC_API_KEY IS set.
 *   2. Fall back to the PUBLIC product-v2 endpoint (no auth, cross-shop) and
 *      adapt the V2 payload into the legacy `IProduct` shape the page renders.
 *   3. Return an OUTCOME (`@/lib/upstream/fetch-upstream`), combined across
 *      the sources by `@/lib/upstream/combine-outcomes.mjs`:
 *        ok           → render
 *        absent       → the page answers a REAL HTTP 404 (decided before any
 *                       byte is sent — see page.tsx)
 *        unavailable  → the page throws → error.tsx, HTTP 5xx, never a 404
 *      (2026-09-09: this used to be `IProduct | null`, so a throttled apiv3
 *      and a missing product were the same `null`, and the page turned both
 *      into a streamed 200 "not found" shell with `noindex`.)
 *      `getInteractiveProduct` keeps the old `IProduct | null` contract for
 *      the fail-open caller (the unified PDP on the slug route).
 *
 * BE dependency (droplinked-backend):
 *   GET {APIV3}/product-v2/public/:id  (@Public, no x-shop-id)
 *   — wrapped by the class-level TransformInterceptor: { statusCode, message, data }.
 */

import { fetchInstance } from '@/lib/fetchInstance';
import { SITE } from '@/lib/site';
import { fetchUpstreamJson, type UpstreamResult } from '@/lib/upstream/fetch-upstream';
import { combineSourceAnswers } from '@/lib/upstream/combine-outcomes.mjs';
import { variantIDs } from '@/lib/variables/variables';
import {
  IProduct,
  IProductMedia,
  ISku,
  initialProductProps,
  initialSkuProps,
} from '@/types/interfaces/product/product';

/** apiv3 base — overridable for dev/preview; defaults to the prod API host. */
const APIV3_PROD = 'https://apiv3.droplinked.com';
const APIV3_BASE = (
  process.env.APIV3_BASE_URL || APIV3_PROD
).replace(/\/+$/, '');

// ---- subset of the apiv3 product-v2 payload we consume -------------------

interface V2Image {
  original?: string | null;
  thumbnail?: string | null;
  alt?: string | null;
}
interface V2Attribute {
  key?: string | null;
  value?: string | null;
  caption?: string | null;
}
interface V2Sku {
  id?: string;
  price?: number | null;
  inventory?: { quantity?: number | null } | null;
  attributes?: V2Attribute[] | null;
  externalId?: string | null;
}
interface V2Product {
  id?: string;
  title?: string;
  description?: string | null;
  type?: string | null;
  shopId?: string | null;
  shop?: { id?: string } | null;
  isPurchasable?: boolean | null;
  defaultImageIndex?: number | null;
  images?: V2Image[] | null;
  skus?: V2Sku[] | null;
  tags?: string[] | null;
}

// ---- V2 → legacy IProduct adapter (pure) ---------------------------------

/**
 * Only `color` and `size` drive the legacy variant selectors; every other V2
 * attribute (e.g. "Gender") has no legacy variantID and is intentionally
 * dropped so it never renders a broken selector. Keyed case-insensitively.
 */
const VARIANT_KEY_TO_ID: Record<string, string> = {
  color: variantIDs.color._id,
  colour: variantIDs.color._id,
  size: variantIDs.size._id,
};

function attributesToOptions(attributes: V2Attribute[] | null | undefined) {
  const options: Array<{ variantID: string; caption: string; value: string; _id: string }> = [];
  for (const attr of attributes ?? []) {
    const key = String(attr?.key ?? '').trim().toLowerCase();
    const variantID = VARIANT_KEY_TO_ID[key];
    if (!variantID) continue;
    const caption = String(attr?.caption ?? attr?.value ?? '').trim();
    if (!caption) continue;
    options.push({
      variantID,
      caption,
      value: String(attr?.value ?? caption),
      _id: `${variantID}:${caption}`,
    });
  }
  return options;
}

function skuV2ToLegacy(sku: V2Sku): ISku {
  return {
    ...initialSkuProps,
    _id: String(sku?.id ?? ''),
    price: typeof sku?.price === 'number' ? sku.price : 0,
    quantity: typeof sku?.inventory?.quantity === 'number' ? sku.inventory.quantity : 0,
    externalID: String(sku?.externalId ?? ''),
    options: attributesToOptions(sku?.attributes),
  };
}

function imagesToMedia(
  images: V2Image[] | null | undefined,
  defaultImageIndex: number | null | undefined,
): IProductMedia[] {
  const arr = Array.isArray(images) ? images : [];
  const mainIdx =
    typeof defaultImageIndex === 'number' && defaultImageIndex >= 0 && defaultImageIndex < arr.length
      ? defaultImageIndex
      : 0;
  const media: IProductMedia[] = [];
  arr.forEach((img, i) => {
    const url = img?.original || img?.thumbnail;
    if (!url) return;
    media.push({
      url,
      thumbnail: img?.thumbnail || url,
      isMain: i === mainIdx ? 'true' : 'false',
      _id: `img-${i}`,
    });
  });
  // Guarantee exactly one "main" so ms(media) always resolves a hero image.
  if (media.length && !media.some((m) => m.isMain === 'true')) media[0].isMain = 'true';
  return media;
}

/** Map a product-v2 payload onto the legacy IProduct shape the page renders. */
export function adaptProductV2ToLegacy(v2: V2Product): IProduct {
  const productType = String(v2?.type ?? '').toUpperCase(); // 'PHYSICAL' | 'DIGITAL' | …
  const skus = Array.isArray(v2?.skus) ? v2.skus : [];
  return {
    ...initialProductProps,
    _id: String(v2?.id ?? ''),
    ownerID: String(v2?.shopId ?? v2?.shop?.id ?? ''),
    title: String(v2?.title ?? ''),
    description: typeof v2?.description === 'string' ? v2.description : '',
    type: productType,
    product_type: productType,
    skuIDs: skus.map(skuV2ToLegacy),
    media: imagesToMedia(v2?.images, v2?.defaultImageIndex),
    purchaseAvailable: v2?.isPurchasable !== false,
    tags: Array.isArray(v2?.tags) ? v2.tags : [],
    ruleSet: null,
  };
}

// ---- fetch (never throws) ------------------------------------------------

const HEADERS = {
  Accept: 'application/json',
  'User-Agent': `${SITE.name}-shopfront/1.0 (interactive-pdp)`,
};

/**
 * Unwrap the TransformInterceptor envelope `{ statusCode, message, data }`
 * when present; otherwise treat the payload as the product itself.
 */
function unwrapV2(raw: unknown): V2Product | null {
  const outer = raw as { data?: unknown };
  const payload =
    outer && typeof outer === 'object' && outer.data && typeof outer.data === 'object'
      ? outer.data
      : raw;
  return payload && typeof payload === 'object' ? (payload as V2Product) : null;
}

/**
 * GET the public product-v2 record as an OUTCOME. Never throws.
 *   ok           a product-shaped payload
 *   absent       apiv3 404 (unknown / gated) or 400 (not an ObjectId)
 *   unavailable  429 / 5xx / network / a 2xx that is not a product
 */
async function fetchPublicProductV2(
  productId: string,
  base: string = APIV3_BASE,
): Promise<UpstreamResult<V2Product>> {
  const url = `${base}/product-v2/public/${encodeURIComponent(productId)}`;
  const result = await fetchUpstreamJson(url, {
    next: { revalidate: 300 },
    headers: HEADERS,
  });
  if (result.outcome !== 'ok') return result;
  const product = unwrapV2(result.body);
  if (!product) {
    return { outcome: 'unavailable', status: result.status, reason: 'unrecognised payload' };
  }
  return { outcome: 'ok', status: result.status, body: product };
}

/**
 * A product is SELLABLE when it carries at least one SKU — that's what the
 * interactive body needs to render price / variants / Buy. A source can
 * legitimately return a product-shaped object with ZERO skus (observed on the
 * dev env: the shop-scoped legacy endpoint holds a partial copy of a prod
 * product — title only, no skus/media). Accepting such a payload renders an
 * empty buy page (no price, no size, no images) and poisons the ISR cache for
 * 5 minutes, so sources that answer but aren't sellable only WIN if nothing
 * better exists.
 */
function isSellable(p: IProduct | null | undefined): boolean {
  return !!p && Array.isArray(p.skuIDs) && p.skuIDs.length > 0;
}

/** One source's answer, in the shape `combineSourceAnswers` ranks. */
type SourceAnswer =
  | { outcome: 'ok'; status: number; body: IProduct; complete: boolean }
  | Exclude<UpstreamResult<never>, { outcome: 'ok' }>;

function v2Answer(result: UpstreamResult<V2Product>): SourceAnswer {
  if (result.outcome !== 'ok') return result;
  const product = adaptProductV2ToLegacy(result.body);
  return { outcome: 'ok', status: result.status, body: product, complete: isSellable(product) };
}

/**
 * Resolve the interactive PDP product across every source, as an OUTCOME.
 * Never throws.
 *
 * Source order (unchanged): the legacy shop-scoped endpoint, then the public
 * cross-shop product-v2 endpoint, then — on a dev deploy only — prod's
 * product-v2. The FIRST SELLABLE answer wins; sku-less partials are kept only
 * as a last resort so the page still renders something identifiable. What is
 * new is what happens when nothing renders: a source that was throttled or
 * down makes the whole result `unavailable` (the page answers 5xx, uncached);
 * only when every source that answered said "no such product" is the result
 * `absent` (the page answers a real 404).
 */
export async function resolveInteractiveProduct(
  productId: string,
): Promise<UpstreamResult<IProduct>> {
  const answers: SourceAnswer[] = [];

  // 1. Legacy shop-scoped endpoint. On the aggregate root this throws
  //    "Unauthorized!" before any request (no x-shop-id) — swallow and fall
  //    through. It also throws on any non-2xx, with no status to classify, so
  //    a throw here is "no answer", not an outcome: today's fail-open stays.
  //    On dev this endpoint can answer with a PARTIAL product (no skus) — do
  //    not let it shadow the full payload from the sources below.
  try {
    const legacy = await fetchInstance(`products/${productId}`);
    if (legacy && typeof legacy === 'object' && Array.isArray((legacy as IProduct).skuIDs)) {
      const p = legacy as IProduct;
      answers.push({ outcome: 'ok', status: 200, body: p, complete: isSellable(p) });
    }
  } catch {
    /* no shop identity on the aggregate root, or route/product missing */
  }

  // 2. Public cross-shop product-v2 endpoint (no auth), adapted to legacy shape.
  answers.push(v2Answer(await fetchPublicProductV2(productId)));

  // 3. Dev-preview cross-host fallback. The per-product SEO landing page sources
  //    its structured-data from PROD apiv3 (hardcoded in structured-data.ts), so
  //    on a dev deploy (APIV3_BASE_URL=apiv3dev) a PROD-only product 404s on the
  //    dev host above and the unified PDP would fail open to the static teaser —
  //    making the feature un-previewable on dev. Retry against PROD so the dev
  //    preview can render prod products' interactive body. No-op on prod, where
  //    APIV3_BASE already IS prod (the two are equal → skipped).
  if (APIV3_BASE !== APIV3_PROD) {
    answers.push(v2Answer(await fetchPublicProductV2(productId, APIV3_PROD)));
  }

  return combineSourceAnswers(answers);
}

/**
 * The fail-open view of `resolveInteractiveProduct`: the product, or null
 * for BOTH absent and unavailable. Kept for the caller that has something
 * better than an error to fall back to (the unified PDP on
 * `/<shop>/product/<slug>` renders its static teaser instead). A page whose
 * only alternative is a status code must use `resolveInteractiveProduct`.
 */
export async function getInteractiveProduct(productId: string): Promise<IProduct | null> {
  const result = await resolveInteractiveProduct(productId);
  return result.outcome === 'ok' ? result.body : null;
}
