import { IAddToCartService, IChangeQuantityService } from '@/lib/apis/cart/interface';

export interface IAddToCart extends Omit<IAddToCartService, 'cartId' | 'shopID'> {}

export interface IChangeQuantity extends Omit<IChangeQuantityService, 'shopID'> {}

export interface IAddStepInfo {
  step: 'address' | 'email' | 'shipping';
  value: any;
}
