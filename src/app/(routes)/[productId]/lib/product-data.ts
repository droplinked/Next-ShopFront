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
 * This loader is FAIL-OPEN and NEVER throws:
 *   1. Try the legacy shop-scoped endpoint — unchanged behavior on single-shop
 *      deployments where NEXT_PUBLIC_API_KEY IS set.
 *   2. Fall back to the PUBLIC product-v2 endpoint (no auth, cross-shop) and
 *      adapt the V2 payload into the legacy `IProduct` shape the page renders.
 *   3. Return null on total failure → the page falls through to `notFound()`
 *      (a real 404 page, never a black screen).
 *
 * BE dependency (droplinked-backend):
 *   GET {APIV3}/product-v2/public/:id  (@Public, no x-shop-id)
 *   — wrapped by the class-level TransformInterceptor: { statusCode, message, data }.
 */

import { fetchInstance } from '@/lib/fetchInstance';
import { SITE } from '@/lib/site';
import { variantIDs } from '@/lib/variables/variables';
import {
  IProduct,
  IProductMedia,
  ISku,
  initialProductProps,
  initialSkuProps,
} from '@/types/interfaces/product/product';

/** apiv3 base — overridable for dev/preview; defaults to the prod API host. */
const APIV3_BASE = (
  process.env.APIV3_BASE_URL || 'https://apiv3.droplinked.com'
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

async function fetchPublicProductV2(productId: string): Promise<V2Product | null> {
  const url = `${APIV3_BASE}/product-v2/public/${encodeURIComponent(productId)}`;
  let response: Response;
  try {
    response = await fetch(url, {
      next: { revalidate: 300 },
      headers: {
        Accept: 'application/json',
        'User-Agent': `${SITE.name}-shopfront/1.0 (interactive-pdp)`,
      },
    });
  } catch {
    return null; // network error → not-found, never throw
  }
  if (!response.ok) return null; // 404 = unknown/gated, 5xx = backend down

  let raw: unknown;
  try {
    raw = await response.json();
  } catch {
    return null;
  }

  // Unwrap the TransformInterceptor envelope { statusCode, message, data } when
  // present; otherwise treat the payload as the product itself.
  const outer = raw as { data?: unknown };
  const payload =
    outer && typeof outer === 'object' && outer.data && typeof outer.data === 'object'
      ? outer.data
      : raw;
  return payload && typeof payload === 'object' ? (payload as V2Product) : null;
}

/**
 * Resolve the interactive PDP product, fail-open. Tries the legacy shop-scoped
 * endpoint first (single-shop deployments), then the public cross-shop
 * product-v2 endpoint (aggregate root). Returns a legacy-shaped IProduct, or
 * null when the product cannot be resolved anywhere → page calls notFound().
 * NEVER throws.
 */
export async function getInteractiveProduct(productId: string): Promise<IProduct | null> {
  // 1. Legacy shop-scoped endpoint. On the aggregate root this throws
  //    "Unauthorized!" (no x-shop-id) — swallow and fall through.
  try {
    const legacy = await fetchInstance(`products/${productId}`);
    if (legacy && typeof legacy === 'object' && Array.isArray((legacy as IProduct).skuIDs)) {
      return legacy as IProduct;
    }
  } catch {
    /* no shop identity on the aggregate root, or route/product missing */
  }

  // 2. Public cross-shop product-v2 endpoint (no auth), adapted to legacy shape.
  const v2 = await fetchPublicProductV2(productId);
  if (v2) return adaptProductV2ToLegacy(v2);

  return null;
}
