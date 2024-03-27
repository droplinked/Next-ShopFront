import { roboto } from "@/styles/fonts";

export const BASE_API_URL = process.env.NEXT_PUBLIC_BASE_API_URL;
export const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
export const APP_DEVELOPMENT = process.env.NEXT_PUBLIC_APP_DEVELOPMENT === "true";
export const variantIDs = { color: { _id: "62a989ab1f2c2bbc5b1e7153" }, size: { _id: "62a989e21f2c2bbc5b1e7154" } };
export const app_vertical = "flex flex-col items-center justify-center";
export const app_center = "flex items-center justify-center";
export const app_link = `underline text-link-foreground ${roboto.className}`;
export const hide = {
    below: { sm: "hidden md:block", md: "hidden lg:block", lg: "hidden xl:block", xl: "hidden 2xl:block", "2xl": "hidden 2xl:block" },
    above: { sm: "sm:hidden", md: "md:hidden", lg: "lg:hidden", xl: "xl:hidden", "2xl": "2xl:hidden" },
};
export const link_style = `font-medium text-sm text-[#179EF8] underline`
