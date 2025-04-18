import { AppDotLabel, AppRadioInput, AppTypography } from "@/components/ui";
import { IShippingMethodOption } from "./interface";
import { cn } from "@/lib/utils/cn/cn";
import { app_center, app_vertical } from "@/lib/variables/variables";

const ShippingMethodOption = ({ shippingData, ...props }: IShippingMethodOption) => {
    const estimated = (/(?:Estimated delivery: )(\w+\s\d+(?:⁠–\d+)?)\b/g)?.exec(shippingData?.title)?.[0]
    return (
        <AppRadioInput {...props}>
            <div className={cn(app_vertical, "w-full justify-start gap-2 -mt-1")}>
                <div className={cn(app_center, "justify-between w-full")}>
                    <AppTypography appClassName="text-sm">{shippingData?.title.replace(/\([^)]*\)/g, "")}</AppTypography>
                    <AppTypography appClassName="text-sm font-normal" price>{shippingData?.price}</AppTypography>
                </div>
                <div className={cn(app_center, "justify-between w-full")}>
                    <AppDotLabel label={"Fulfillment Date"} content={shippingData?.delivery_estimation} appClassNames={{ container: cn(app_center, "gap-2"), title: "text-sm font-normal opacity-25", dot: "text-sm font-normal opacity-25", value: "text-sm font-normal opacity-100" }}/>
                    <AppDotLabel label={"Estimated delivery"} content={estimated || ""} appClassNames={{ container: cn(app_center, "gap-2"), title: "text-sm font-normal opacity-25", dot: "text-sm font-normal opacity-25", value: "text-sm font-normal opacity-100" }}/>
                </div>
            </div>
        </AppRadioInput>
    );
};

export default ShippingMethodOption;
