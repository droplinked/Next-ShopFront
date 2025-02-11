'use client';

import { addToCartService, changeQuantityService, createCartService, getCartService } from '@/lib/apis/cart/service';
import useAppStore from '@/lib/stores/app/appStore';
import { IAddToCart, IChangeQuantity } from './interface';
import { ICart } from '@/types/interfaces/cart/cart';
import { IAddAddressToCartService, IAddEmailToCartService, IAddShippingToCartService, IApplyGiftCardService } from '@/lib/apis/checkout/interface';
import { addAddressToCartService, addEmailToCartService, addShippingToCartService, applyGiftCardService } from '@/lib/apis/checkout/service';

function useAppCart() {
  const {
    methods: { updateState },
    states: { cart, shop, user }
  } = useAppStore();

  const _update = (data: any) => data && updateState({ state: 'cart', value: data });

  const _create = () =>
    new Promise<ICart>(
      async (resolve, reject) =>
        await createCartService()
          .then((res) => resolve(_update(res)))
          .catch((err) => reject(err))
    );

  const _add_params = async ({ skuID, quantity, m2m_data }: IAddToCart) => ({
    cartId: cart._id ? cart._id : (await _create())?._id,
    shopID: shop?._id,
    skuID,
    quantity,
    ...(m2m_data && { m2m_data })
  });

  const addEmailToCart = (params: IAddEmailToCartService) =>
    new Promise<any>(async (resolve, reject) =>
      addEmailToCartService(params)
        .then((res) => resolve(_update(res)))
        .catch((err) => reject(err))
    );

  const addAddressToCart = (params: IAddAddressToCartService, email: string) =>
    new Promise<any>(async (resolve, reject) =>
      addEmailToCart({ cartId: params.cartId, email })
        .then((res) => addAddressToCartService(params))
        .then((res) => resolve(_update(res)))
        .catch((err) => reject(err))
    );

  const addShippingToCart = ({ cartId, rates }: IAddShippingToCartService) =>
    new Promise<any>(async (resolve, reject) =>
      addShippingToCartService({ cartId, rates })
        .then((res) => resolve(_update(res)))
        .catch((err) => reject(err))
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
        await addToCartService(await _add_params(params))
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

  return { addItemToCart, fetchCart, updateCartItemQuantity, addAddressToCart, addShippingToCart, applyGiftCardToCart };
}

export default useAppCart;
