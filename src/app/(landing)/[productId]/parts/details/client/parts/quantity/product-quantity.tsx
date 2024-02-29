import { useContext } from "react";
import ProductContext from "../../context";
import { AppQuantity, AppTypography } from "@/components/shared";

const ProductQuantity = () => {
    const { states: {option: { quantity }}, methods: { updateOption }} = useContext(ProductContext);
    
    return (
        <div className="flex flex-col gap-6">
            <AppTypography appClassName="text-base">Quantity</AppTypography>
            <AppQuantity onChange={(value: string) => updateOption("quantity", value)} value={quantity} />
        </div>
    );
};

export default ProductQuantity;
