import { AppDotLabel, AppTypography } from "@/components/ui";
import { cn } from "@/lib/utils/cn/cn";
import { app_center, app_vertical } from "@/lib/variables/variables";
import React from "react";
import { ICartItem } from "@/types/interfaces/cart/cart";
import NumberedProduct from "./numbered/AppNumbered";
import { IAppProductSummary } from "./interface";

const AppProductSummary = ({ details: { quantity, color, size, image, title, priceItem } }: IAppProductSummary) => 
(
    <div className={cn(app_center, "justify-between w-full gap-4")}>
        <NumberedProduct number={quantity} image={image} alt={title} />
        <div className={cn(app_vertical, "w-full gap-2")}>
            <div className={cn(app_center, "justify-between w-full gap-2")}><AppTypography className=" overflow-hidden whitespace-nowrap text-ellipsis w-48">{title}</AppTypography><AppTypography price appClassName="font-normal text-sm">{priceItem}</AppTypography></div>
        <AppDotLabel label="Size" content={size} appClassNames={{ container: "flex justify-start items-center gap-2 w-full", title: "text-xs font-normal opacity-25", dot: "text-xs font-normal opacity-25", value: "text-xs font-normal" }}/>
            <AppDotLabel label="Color" content={color} appClassNames={{ container: "flex justify-start items-center gap-2 w-full", title: "text-xs font-normal opacity-25", dot: "text-xs font-normal opacity-25", value: "text-xs font-normal" }}/>
        </div>
    </div>
)
export default AppProductSummary;
