import { AppTypography } from "@/components/ui";

const EachItemCaption = ({ label, price }: { label: string; price: number }) => {
    return (
        <div className={"flex flex-col items-start w-full gap-2"}>
            <AppTypography className="h-[3em] font-normal text-sm text-left w-full line-clamp-2">{label}</AppTypography>
            <AppTypography appClassName="font-bold text-base w-full" price>{price}</AppTypography>
        </div>
    );
};

export default EachItemCaption;
