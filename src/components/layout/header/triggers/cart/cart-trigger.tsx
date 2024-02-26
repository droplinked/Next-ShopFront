"use client";
import AppIcons from "@/assets/AppIcons";
import AppIconButton from "@/components/shared/button/icon/AppIconButton";
import { AppPopover } from "@/components/shared/popover/AppPopover";
import AppTypography from "@/components/shared/typography/AppTypography";
import useAppCart from "@/functions/hooks/cart/useAppCart";
import useAppStore from "@/lib/stores/app/appStore";
import { cn } from "@/lib/utils/cn/cn";
import { app_center, app_vertical } from "@/lib/variables/variables";
import { usePopupState } from "material-ui-popup-state/hooks";
import { useCallback, useEffect, useState } from "react";
import EmptyCart from "./parts/empty/empty-cart";
import { ICart } from "@/lib/stores/app/interfaces/cart";
import EachCartItem from "./parts/each/each-cart-item";
import AppSeparator from "@/components/shared/separator/AppSeparator";
import AppButton from "@/components/shared/button/AppButton";
import Link from "next/link";

const CartTrigger = () => {
    const popupState = usePopupState({ variant: "popover", popupId: "droplinked-popup-popover" });
    const {states: { cart }} = useAppStore()
    const { get } = useAppCart()
    const [cartState, setCartState] = useState<ICart>(cart)
    const getCart = useCallback(async() => cart?._id && await get(cart?._id), [cart?.items]);
    useEffect(()=> { getCart() }, [])

    return (
        <AppPopover trigger={<AppIconButton><AppIcons.Cart /></AppIconButton>} popupState={popupState} anchor={{ vertical: "bottom", horizontal: "left" }} transform={{ vertical: "top", horizontal: "right" }}>
            <section className={cn(app_vertical, "w-full py-6 px-7 gap-6 rounded-lg bg-background max-w-[420px]")}>
                <header className={cn(app_center, "w-full justify-between text-xl sticky top-0 pt-6 bg-background")}><AppTypography appClassName="text-lg">My Cart</AppTypography><AppIcons.Close onClick={popupState.close} className="cursor-pointer" /></header>
                <div className={cn(app_vertical, 'gap-6 p-4 rounded-sm border border-border')}>{cart?.items?.length ? cart?.items?.map((item)=> <div key={item?._id} className="w-full"><EachCartItem  item={item}/><AppSeparator appClassName='my-6 w-full'/></div>) : <EmptyCart/>}</div>
                <footer className={cn(app_vertical, 'w-full sticky bottom-0 pb-6 bg-background gap-6')}>
                    <div className={cn(app_center, 'justify-between w-full')}><AppTypography appClassName="text-sm font-normal">Total Cart</AppTypography><AppTypography price appClassName="text-xl font-medium">{cart?.totalCart?.subtotal}</AppTypography></div>
                    <form onSubmit={() => ""} className="flex justify-center items-center w-full gap-6">
                        <div className="min-w-fit"><AppButton type="submit" appClassName="rounded-sm w-full text-base font-normal" appVariant="outlined" appSize="md">Clear</AppButton></div>
                        <Link href={'/checkout'} className="flex items-center justify-center w-full py-3 px-4 border-none bg-foreground text-background rounded-sm"><AppTypography>Checkout</AppTypography></Link>
                    </form>
                </footer>
            </section>
        </AppPopover>
    );
};

export default CartTrigger;
