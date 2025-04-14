import { IAddToCartService, IChangeQuantityService } from "@/services/cart/interface";


export interface IAddToCart extends Omit<IAddToCartService, 'cartId' | 'shopID'> {}

export interface IChangeQuantity extends Omit<IChangeQuantityService, 'shopID'> {}

export interface IAddStepInfo {
  step: 'address' | 'email' | 'shipping';
  value: any;
}
