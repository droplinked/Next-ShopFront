"use client"
import { add_to_cart_service, create_cart_service } from "@/lib/apis/cart/service";
import useCartModel from "./model";
import useAppStore from "@/lib/stores/app/appStore";
import { IAddToCart } from "./interface";

function useAppCart() {
    const { removeCart } = useCartModel;
    const { methods: { updateState }, states: { cart, shop, user }} = useAppStore();
    
    const _update = (data: any) => updateState({ state: "cart", value: data ? data : removeCart(cart, shop.name) });
    const _create = () => new Promise<any>(async (resolve, reject) => await create_cart_service().then((res) => resolve(_update(res))).catch((error) => reject(error)));
    const _cartId = async() => cart?._id || (await _create())?._id;
    const _add_params = async ({ skuID, quantity, m2m_data }: IAddToCart) => ({ cartId: await _cartId(), shopID: "64d7714abedfcc2ca9d1442c", skuID, quantity, ...(m2m_data && { m2m_data })})
    const add = async (params: IAddToCart) => new Promise<any>(async (resolve, reject) => await add_to_cart_service(await _add_params(params)).then((res) => resolve(_update(res))).catch((error: any) => reject(error)));

    return { add };
}

export default useAppCart;
