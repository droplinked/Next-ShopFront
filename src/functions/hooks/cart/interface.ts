import { IAddToCartService, ICahngeQuantityService } from "@/lib/apis/cart/interface";

export interface IAddToCart extends Omit<IAddToCartService, "cartId" | "shopID"> {}

export interface IChangeQuantity extends Omit<ICahngeQuantityService, "shopID"> {}

export interface IAddStepInfo {
    step: 'address' | 'email' | 'shipping'
    value: any
}