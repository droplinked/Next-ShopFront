import { cn } from "@/lib/utils/cn/cn";
import { app_vertical } from "@/lib/variables/variables";
import EachItemCover from "./parts/cover/each-item-cover";
import EachItemCaption from "./parts/caption/each-item-caption";
import { useMemo } from "react";
import { IProductMedia, ISku } from "@/types/interfaces/product/product";
import { ms } from "@/lib/utils/ms/ms";

const ExploreEachItem = ({ label, media, skuIDs }: { label: string; media: IProductMedia[]; skuIDs: ISku[] }) => {
    const _main_sku = useMemo(() => ms(media), [media]);
    return (
        <div className={cn(app_vertical, "justify-start gap-4")}>
            <EachItemCover src={_main_sku} alt={label} />
            <EachItemCaption label={label} price={skuIDs![0]?.price || 0} />
        </div>
    );
};

export default ExploreEachItem;
