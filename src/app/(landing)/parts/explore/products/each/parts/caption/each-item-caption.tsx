import AppTypography from "@/components/shared/typography/AppTypography";
import { cn } from "@/lib/utils/cn/cn";
import { app_vertical } from "@/lib/variables/variables";

const EachItemCaption = ({ label, price }: { label: string; price: number }) => {
    return (
        <div className={"flex flex-col justify-between w-full gap-2 h-full"}>
            <AppTypography appClassName="font-normal text-sm text-left w-full">{label}</AppTypography>
            <AppTypography appClassName="font-bold text-base w-full" price>{price}</AppTypography>
        </div>
    );
};

export default EachItemCaption;
