import { IProductMedia } from "@/types/interfaces/product/product";

export function ms(medias: IProductMedia[]) {
    // Null-safe: the interactive PDP can render products with no/undefined media
    // (sparse aggregate items) — never throw on `.find` of undefined.
    return medias?.find((el: any) => el.isMain === "true")?.url || ""
}
  