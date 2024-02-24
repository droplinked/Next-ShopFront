import { variantIDs } from "@/lib/variables/variables";

interface IFindSkuAsOption {
    skuIDs: any;
    color: string | null;
    size: string | null;
}

namespace productClientModel {
    export const getFirstOption = (sku: any) => {
        const option = (variantID: string) => sku?.options.find((el: any) => el.variantID === variantID)?.caption;
        return { color: option(variantIDs.color._id) || null, size: option(variantIDs.size._id) || null };
    };

    export const findSkuAsOption = ({ color, size, skuIDs }: IFindSkuAsOption) => {
        if (!(skuIDs && (color || size))) return null;
        const findOption = (options: any, value: string) => options.find((item: any) => item.caption === value);
        return skuIDs.find((el: any) => (color ? findOption(el.options, color) : true) && (size ? findOption(el.options, size) : true));
    };
}

export default productClientModel;
