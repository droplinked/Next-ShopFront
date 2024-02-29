import useAppCart from "@/functions/hooks/cart/useAppCart";
import AppIcons from "@/assets/AppIcons";
import { useContext } from "react";
import ProductContext from "../../context";
import { AppButton } from "@/components/shared";

const AddToCart = () => {
    const { states: { sku, option: { quantity } } } = useContext(ProductContext);
    const { add } = useAppCart();
    const submit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        await add({ skuID: sku._id, quantity });
    }
    
    return (
        <form onSubmit={submit} className="flex w-full gap-6">
            <div className="min-w-fit"><AppButton appClassName="rounded-sm w-full" hasIcon appVariant="outlined" appSize="lg"><AppIcons.Merch />Mint to Merch</AppButton></div>
            <div className="w-full"><AppButton type="submit" appClassName="rounded-sm w-full" hasIcon appVariant="filled" appSize="lg"><AppIcons.CartLight />Add to cart</AppButton></div>
        </form>
    );
};

export default AddToCart;
