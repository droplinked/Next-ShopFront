import React, { useContext } from "react";
import ProductContext from "../../context";
import { AppSkeleton, AppTypography } from "@/components/ui";

function ProductPrice() {
    const { states: { product, ruleset, sku } } = useContext(ProductContext);
    const discountPercentage = product?.ruleSet && !product?.ruleSet?.gated && ruleset && typeof ruleset.data?.discountPercentage === "number" && ruleset.data?.discountPercentage;

    return sku?.price ? (ruleset.loading ? (<AppSkeleton maxHeight="40px" />) : (
            <span>
                {!discountPercentage ? (<AppTypography appClassName="text-4xl" price>{sku?.price.toFixed(2)}</AppTypography>) : (<>
                    <AppTypography price>{(sku?.price - (sku?.price / 100) * discountPercentage).toFixed(2)}</AppTypography>
                    <AppTypography appClassName="line-through opacity-70 text-sm">${sku?.price.toFixed(2)}</AppTypography>
                </>)}
            </span>
        )
    ) : null;
}

export default ProductPrice;
