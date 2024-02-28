import AppTypography from "@/components/shared/typography/AppTypography";
import useAppStore from "@/lib/stores/app/appStore";
import { cn } from "@/lib/utils/cn/cn";
import { app_center } from "@/lib/variables/variables";
import Image from "next/image";
import React from "react";

const ShippingGroupProducts = ({ groupId }: { groupId: string }) => {
    const { states: { cart } } = useAppStore();
    return (
        <div className={cn(app_center, "justify-start w-full gap-4")}>
            {cart?.items.filter((item) => item.groupId === groupId).map((cartItem) => (
                <div className="w-12 h-12 relative" key={cartItem._id}>
                    <AppTypography appClassName={cn(app_center, "text-[10px] font-extrabold w-4 h-4 rounded-full absolute -top-2 -right-2 bg-foreground text-background")}>{cartItem.options.quantity}</AppTypography>
                    <Image src={cartItem.product.image} width={48} height={48} alt={`${cartItem.product.title} shipping group image`} />
                </div>
            ))}
        </div>
    );
};

export default ShippingGroupProducts;
