import { IAddToCartService, ICahngeQuantityService, IM2MProps } from "@/lib/apis/cart/interface";

export interface IAddToCart extends Omit<IAddToCartService, "cartId" | "shopID"> {}

export interface IChangeQuantity extends Omit<ICahngeQuantityService, "cartId" | "shopID"> {}
