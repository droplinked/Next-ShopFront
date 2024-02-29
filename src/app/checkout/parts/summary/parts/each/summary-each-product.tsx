import { AppDotLabel, AppTypography } from "@/components/shared";
import { cn } from "@/lib/utils/cn/cn";
import { app_center, app_vertical } from "@/lib/variables/variables";
import React from "react";
import NumberedProduct from "../../../parts/numbered/numbered-product";
import { ICartItem } from "@/types/interfaces/cart/cart";

const SummaryEachProduct = ({ options, product, totals }: Pick<ICartItem, "options" | "product" | "totals">) => {
    return (
        <div className={cn(app_center, "justify-between w-full gap-4")}>
            <NumberedProduct number={options.quantity} image={product.image} alt={product.title} />
            <div className={cn(app_vertical, "w-full gap-2")}>
                <div className={cn(app_center, "justify-between w-full gap-2")}><AppTypography className=" overflow-hidden whitespace-nowrap text-ellipsis w-48">{product.title}</AppTypography><AppTypography price appClassName="font-normal text-sm">{totals.priceItem}</AppTypography></div>
                <AppDotLabel label="Size" content={options.size.caption} appClassNames={{ container: "flex justify-start items-center gap-2 w-full", title: "text-xs font-normal opacity-25", dot: "text-xs font-normal opacity-25", value: "text-xs font-normal" }}/>
                <AppDotLabel label="Color" content={options.color.caption} appClassNames={{ container: "flex justify-start items-center gap-2 w-full", title: "text-xs font-normal opacity-25", dot: "text-xs font-normal opacity-25", value: "text-xs font-normal" }}/>
            </div>
        </div>
    );
};

export default SummaryEachProduct;
