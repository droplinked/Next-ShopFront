"use client"
import { add_to_cart_service, change_quantity_service, create_cart_service, get_cart_service } from "@/lib/apis/cart/service";
import useAppStore from "@/lib/stores/app/appStore";
import { IAddToCart, IChangeQuantity } from "./interface";
import { ICart } from "@/lib/stores/app/interfaces/cart";
import { ICahngeQuantityService } from "@/lib/apis/cart/interface";

function useAppCart() {
    const { methods: { updateState }, states: { cart, shop, user }} = useAppStore();
    
    const _update = (data: any) => data && updateState({ state: "cart", value: data });
    const _create = () => new Promise<ICart>(async (resolve, reject) => await create_cart_service().then((res) => resolve(_update(res))).catch(err => reject(err)));
    const _cartId = async() => cart?._id || (await _create())?._id;
    const _add_params = async ({ skuID, quantity, m2m_data }: IAddToCart) => ({ cartId: await _cartId(), shopID: shop?._id, skuID, quantity, ...(m2m_data && { m2m_data })})
    const _change_params = async ({ skuID, quantity, itemId }: IChangeQuantity) => ({ cartId: await _cartId(), shopID: shop?._id, skuID, quantity, itemId})
    const add = async (params: IAddToCart) => new Promise<ICart>(async (resolve, reject) => await add_to_cart_service(await _add_params(params)).then((res) => resolve(_update(res))).catch(err => reject(err)));
    const change = async (params: IChangeQuantity) => new Promise<ICart>(async (resolve, reject) => await change_quantity_service(await _change_params(params)).then((res) => resolve(_update(res))).catch(err => reject(err)));
    const get = async (_id: string) => new Promise<ICart>(async (resolve, reject) => await get_cart_service({cartId: _id}).then(res => resolve(_update(res))).catch(err => reject(err)))
    return { add, get, change };
}


export default useAppCart;
