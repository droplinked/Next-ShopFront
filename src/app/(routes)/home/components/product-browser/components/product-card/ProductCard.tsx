import { cn } from "@/lib/utils/cn/cn";
import { ms } from "@/lib/utils/ms/ms";
import { app_vertical } from "@/lib/variables/variables";
import { IProductMedia, ISku } from "@/types/interfaces/product/product";
import Link from "next/link";
import { useMemo } from "react";
import ProductCaption from "./components/ProductCaption";
import ProductImage from "./components/ProductImage";

const ProductCard= ({ id, label, media, skuIDs }: { id: string,label: string; media: IProductMedia[]; skuIDs: ISku[], }) => {
    const _main_sku = useMemo(() => ms(media), [media]);
    return (
        <Link href={`/${id}`} className={cn(app_vertical, "justify-start gap-4")}>
            <ProductImage src={_main_sku} alt={label} />
            <ProductCaption label={label} price={skuIDs![0]?.price || 0} />
        </Link>
    );
};

export default ProductCard;
