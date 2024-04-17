import { AppQuantity } from "@/components/shared";
import useAppCart from "@/functions/hooks/cart/useAppCart";
import useAppStore from "@/lib/stores/app/appStore";
import { ICartItem } from "@/types/interfaces/cart/cart";
import { toast } from "sonner";

const CartItemQuantity = ({ options: { quantity }, skuID, _id }: Pick<ICartItem, "options" | "skuID" | "_id">) => {
    const { change } = useAppCart();
    const { states: { cart } } = useAppStore();
    const _update_quantity = async (new_quantity: number) => cart?._id && _id && toast.promise(async () => await change({ cartId: cart._id, quantity: new_quantity, skuID, itemId: _id }), {loading:"Changing item quantity...", success:"Changing quantity", error: "Got an error"});
    return <AppQuantity value={quantity} onChange={_update_quantity} appClassName="rounded-sm p-1.5 gap-2 w-24" textClassName="text-xs font-normal" />;
};

export default CartItemQuantity;
