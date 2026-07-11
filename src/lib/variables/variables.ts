import { roboto } from "@/styles/fonts";

export const BASE_API_URL = process.env.NEXT_PUBLIC_BASE_API_URL;
export const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
export const APP_DEVELOPMENT = process.env.NEXT_PUBLIC_APP_DEVELOPMENT === "true";
/**
 * Aggregate product catalog at the platform root (shop.droplinked.com/).
 * Uses a NEXT_PUBLIC_ name so Next INLINES the value at build time — the
 * standalone runner does not carry .env, so a plain (non-public) server var
 * reads as undefined at runtime and the root would wrongly redirect to /home.
 * Defaults OFF by being absent from an environment's ENV_FILE; set
 * NEXT_PUBLIC_ROOT_CATALOG_ENABLED=true to enable (reversible, no code revert).
 */
export const ROOT_CATALOG_ENABLED =
  process.env.NEXT_PUBLIC_ROOT_CATALOG_ENABLED === "true";
/**
 * Merchant-of-Record (MoR) checkout context for the aggregate root
 * (shop.droplinked.com). The aggregate root is CROSS-SHOP and carries no single
 * shop identity — NEXT_PUBLIC_API_KEY (the `x-shop-id`) is unset — so cart /
 * checkout requests have no shop to run under and `fetchInstance` throws
 * "Unauthorized!". These two vars let ALL aggregate-root sales run under ONE
 * MoR shop's PSP (e.g. "shopsadiq ltd") without giving the root a per-shop
 * identity.
 *
 * `NEXT_PUBLIC_MOR_SHOP_ID`  — the MoR shop's ObjectId; used as the `x-shop-id`
 *                              for cart/checkout ONLY on the aggregate root
 *                              (i.e. only when NEXT_PUBLIC_API_KEY is unset).
 * `NEXT_PUBLIC_MOR_CHECKOUT_ENABLED` — master flag. Default OFF: absent / any
 *                              value other than the string "true" ⇒ EXACTLY
 *                              today's behavior (no regression on any per-shop
 *                              deployment, where API_KEY is set and this branch
 *                              is never reached). NEXT_PUBLIC_ so Next inlines
 *                              it at build time (the standalone runner does not
 *                              carry .env at runtime — same reasoning as
 *                              ROOT_CATALOG_ENABLED above).
 *
 * NOTE: the FE wiring alone is necessary but NOT sufficient — the backend
 * cart still enforces per-item shop ownership (add-product rejects a product
 * whose shopId !== cart.shopId unless the MoR shop's agent holds an ACTIVE
 * affiliate link for it). See the activation runbook in the PR body.
 */
export const MOR_SHOP_ID = process.env.NEXT_PUBLIC_MOR_SHOP_ID;
export const MOR_CHECKOUT_ENABLED =
  process.env.NEXT_PUBLIC_MOR_CHECKOUT_ENABLED === "true";
export const variantIDs = { color: { _id: "62a989ab1f2c2bbc5b1e7153" }, size: { _id: "62a989e21f2c2bbc5b1e7154" } };
export const app_vertical = "flex flex-col items-center justify-center";
export const app_center = "flex items-center justify-center";
export const app_link = `underline text-link-foreground ${roboto.className}`;
export const hide = {
    below: { sm: "hidden md:block", md: "hidden lg:block", lg: "hidden xl:block", xl: "hidden 2xl:block", "2xl": "hidden 2xl:block" },
    above: { sm: "sm:hidden", md: "md:hidden", lg: "lg:hidden", xl: "xl:hidden", "2xl": "2xl:hidden" },
};
export const link_style = `font-medium text-sm text-[#179EF8] underline`
