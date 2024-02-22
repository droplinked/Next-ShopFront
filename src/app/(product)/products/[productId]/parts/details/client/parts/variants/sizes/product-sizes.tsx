import { useCallback, useContext, useEffect, useMemo } from "react";
import ProductContext from "../../../context";
import productVariantsModel from "../model";
import { cn } from "@/lib/utils/cn/cn";
import AppButton from "@/components/shared/button/AppButton";
import { variantIDs } from "@/lib/variables/variables";
import VariantsLabel from "../parts/label/variants-label";

function ProductSizes() {
    const { skuIDsMatchColor, getOptions } = productVariantsModel;
    const {states: { product, option: { size, color }, sku}, methods: { updateOption }} = useContext(ProductContext);
    const match = useMemo(() => skuIDsMatchColor(product?.skuIDs, color || ""), [product, color]);
    const sizes = useMemo(() => getOptions(product?.skuIDs, "size"), [product, match, color]);
    const active = useCallback((caption: string) => (product?.skuIDs.find((el: any) => el.options.find((item: any) => item.variantID === variantIDs.color._id)) ? match.includes(caption) : true), [sku]);
    useEffect(() => { !sku && sizes.length && color && updateOption("size", match[0]) }, [sku]);

    return sizes.length ? (
        <div className="flex flex-col gap-6">
            <VariantsLabel label="Size" current={size || ""} />
            <div className="flex flex-wrap gap-2.5">{sizes.map(el => <AppButton key={el._id} onClick={() => active(el.caption) && updateOption("size", el.caption)} appVariant="outlined" appClassName={cn( "font-normal text-base w-12 h-12 border border-border py-3 px-4 rounded-sm cursor-pointer min-w-", el.caption === size ? "bg-foreground text-background" : "bg-transparent text-foreground")}>{el.caption}</AppButton>)}</div>
        </div>
    ) : null;
}

export default ProductSizes;
