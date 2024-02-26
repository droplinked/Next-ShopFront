import AppQuantity from "@/components/shared/quantity/AppQuantity";
import useAppCart from "@/functions/hooks/cart/useAppCart";
import { ICartItem } from "@/lib/stores/app/interfaces/cart";
import React from "react";

const CartItemQuantity = ({ options: { quantity }, skuID, _id }: Pick<ICartItem, "options" | "skuID" | "_id">) => {
    const { change } = useAppCart();
    const _update_quantity = async (value: any) => await change({ quantity, skuID, itemId: _id });
    return <AppQuantity value={quantity} onChange={_update_quantity} appClassName="rounded-sm p-1.5 gap-2 w-24" textClassName="text-xs font-normal"/>;
};

export default CartItemQuantity;
