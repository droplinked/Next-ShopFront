'use client';

import useAppStore from '@/lib/stores/app/appStore';
import { IAddToCart, IChangeQuantity } from './interface';
import { ICart } from '@/types/interfaces/cart/cart';
import { IAddShippingToCartService, IApplyGiftCardService } from '@/services/checkout/interface';
import { addShippingToCartService, applyGiftCardService } from '@/services/checkout/service';
import { addToCartService, changeQuantityService, createCartService, getCartService, updateCartDetailsService } from '@/services/cart/service';


function useAppCart() {
  const {
    methods: { updateState },
    states: { cart, shop }
  } = useAppStore();

  const _update = (data: any) => data && updateState({ state: 'cart', value: data });

  const _create = () =>
    new Promise<ICart>(
      async (resolve, reject) =>
        await createCartService()
          .then((res) => resolve(_update(res)))
          .catch((err) => reject(err))
    );

  const _addParams = async ({ skuID, quantity, m2m_data }: IAddToCart) => ({
    cartId: cart._id ? cart._id : (await _create())?._id,
    shopID: shop?._id,
    skuID,
    quantity,
    ...(m2m_data && { m2m_data })
  });
  
  const addCartDetails = (cartId: string, email: string, addressId: string, note?: string) =>
    new Promise<any>(async (resolve, reject) =>
      updateCartDetailsService({ cartId, email, addressId, note })
        .then((res) => resolve(_update(res)))
        .catch((err) => reject(err))
    );

  const addShippingToCart = ({ cartId, rates }: IAddShippingToCartService) =>
    new Promise<any>(async (resolve, reject) =>
      addShippingToCartService({ cartId, rates })
        .then((res) => res.json())
        .then((data) => {
          console.log("Shipping API response data:", data);
          resolve(_update(data));
        })
        .catch((err) => {
          console.error("Shipping error:", err);
          reject(err);
        })
    );

  const applyGiftCardToCart = ({ ...params }: IApplyGiftCardService) =>
    new Promise<any>(async (resolve, reject) =>
      applyGiftCardService({ ...params })
        .then((res) => resolve(_update(res)))
        .catch((err) => reject(err))
    );

  const addItemToCart = async (params: IAddToCart) =>
    new Promise<ICart>(
      async (resolve, reject) =>
        await addToCartService(await _addParams(params))
          .then((res) => resolve(_update(res)))
          .catch((err) => reject(err))
    );

  const updateCartItemQuantity = async ({ cartId, skuID, quantity, itemId }: IChangeQuantity) =>
    new Promise<ICart>(
      async (resolve, reject) =>
        await changeQuantityService({ cartId, shopID: shop?._id, skuID, quantity, itemId })
          .then((res) => resolve(_update(res)))
          .catch((err) => reject(err))
    );

  const fetchCart = async (_id: string) =>
    new Promise<ICart>(
      async (resolve, reject) =>
        await getCartService({ cartId: _id })
          .then((res) => resolve(_update(res)))
          .catch((err) => reject(err))
    );

  return { addItemToCart, fetchCart, updateCartItemQuantity, addCartDetails, addShippingToCart, applyGiftCardToCart };
}

export default useAppCart;
