"use client";
import { add_to_cart_service, change_quantity_service, create_cart_service, get_cart_service } from "@/lib/apis/cart/service";
import useAppStore from "@/lib/stores/app/appStore";
import { IAddToCart, IChangeQuantity } from "./interface";
import { ICart } from "@/types/interfaces/cart/cart";
import { IAddAddressToCartService, IAddEmailToCartService, IAddShippingToCartService, IApplyGiftCardService } from "@/lib/apis/checkout/interface";
import { add_address_to_cart_service, add_email_to_cart_service, add_shipping_to_cart_service, apply_giftcard_service } from "@/lib/apis/checkout/service";

function useAppCart() {
    const { methods: { updateState }, states: { cart, shop, user }} = useAppStore();

    const _update = (data: any) => data && updateState({ state: "cart", value: data });

    const _create = () =>
        new Promise<ICart>(
            async (resolve, reject) =>
                await create_cart_service()
                    .then((res) => resolve(_update(res)))
                    .catch((err) => reject(err))
        );

    const _add_params = async ({ skuID, quantity, m2m_data }: IAddToCart) => ({
        cartId: cart._id ? cart._id : (await _create())?._id,
        shopID: shop?._id,
        skuID,
        quantity,
        ...(m2m_data && { m2m_data }),
    });

    const _add_email = (params: IAddEmailToCartService) =>
        new Promise<any>(async (resolve, reject) =>
            add_email_to_cart_service(params)
                .then((res) => resolve(_update(res)))
                .catch((err) => reject(err))
        );

    const add_address = (params: IAddAddressToCartService, email: string) =>
        new Promise<any>(async (resolve, reject) =>
            _add_email({ cartId: params.cartId, email })
                .then((res) => add_address_to_cart_service(params))
                .then((res) => resolve(_update(res)))
                .catch((err) => reject(err))
        );

    const add_shipping = ({ cartId, rates }: IAddShippingToCartService) =>
        new Promise<any>(async (resolve, reject) =>
            add_shipping_to_cart_service({ cartId, rates })
                .then((res) => resolve(_update(res)))
                .catch((err) => reject(err))
        );

    const add_gift = ({ ...params }: IApplyGiftCardService) =>
        new Promise<any>(async (resolve, reject) =>
            apply_giftcard_service({ ...params })
                .then((res) => resolve(_update(res)))
                .catch((err) => reject(err))
        );

    const add = async (params: IAddToCart) =>
        new Promise<ICart>(
            async (resolve, reject) =>
                await add_to_cart_service(await _add_params(params))
                    .then((res) => resolve(_update(res)))
                    .catch((err) => reject(err))
        );

    const change = async ({ cartId, skuID, quantity, itemId }: IChangeQuantity) =>
        new Promise<ICart>(
            async (resolve, reject) =>
                await change_quantity_service({ cartId, shopID: shop?._id, skuID, quantity, itemId })
                    .then((res) => resolve(_update(res)))
                    .catch((err) => reject(err))
        );

    const get = async (_id: string) =>
        new Promise<ICart>(
            async (resolve, reject) =>
                await get_cart_service({ cartId: _id })
                    .then((res) => resolve(_update(res)))
                    .catch((err) => reject(err))
        );

    return { add, get, change, add_address, add_shipping, add_gift };
}

export default useAppCart;
