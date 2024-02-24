import { IProductMedia } from "@/types/interfaces/product/product";

export function ms(medias: IProductMedia[]) {
    return medias.find((el: any) => el.isMain === "true")?.url || ""
}
  