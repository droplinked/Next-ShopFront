import {
  API_KEY,
  BASE_API_URL,
  MOR_CHECKOUT_ENABLED,
  MOR_SHOP_ID,
} from "./variables/variables";

/**
 * Resolve the shop context sent as the `x-shop-id` header for this request.
 *
 * Default behavior (unchanged): use the deployment's ambient shop identity
 * (NEXT_PUBLIC_API_KEY). A per-shop deployment always has this set, so the
 * `||` short-circuits before the MoR branch is ever evaluated — behavior is
 * byte-identical to before this change on every real shop.
 *
 * MoR aggregate-root fallback (flag-gated, DEFAULT OFF): ONLY when this
 * deployment has NO ambient shop identity (API_KEY unset — i.e. the
 * shop.droplinked.com aggregate root) AND `NEXT_PUBLIC_MOR_CHECKOUT_ENABLED`
 * is explicitly "true" AND a MoR shop id is configured, fall back to the
 * Merchant-of-Record shop so all aggregate-root cart/checkout traffic runs
 * under ONE MoR shop's PSP. When the flag is off/unset, or no MoR shop id is
 * set, we resolve to `undefined` and throw "Unauthorized!" exactly as before
 * (fail-open: no new code path is taken).
 */
function resolveShopId(): string | undefined {
  if (API_KEY) return API_KEY;
  if (MOR_CHECKOUT_ENABLED && MOR_SHOP_ID) return MOR_SHOP_ID;
  return undefined;
}

export async function fetchInstance(url: string, options?: RequestInit) {
  const shopId = resolveShopId();
  if (!shopId) throw new Error("Unauthorized!");

  const response = await fetch(`${BASE_API_URL}${url}`, {
    credentials: 'include',
    headers: {
      "Content-Type": "application/json",
      "x-shop-id": shopId,
      "Accept": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Network Error");
  }

  return response.json();
}
