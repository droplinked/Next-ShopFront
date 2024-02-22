import { ISku } from "@/app/types/interfaces/product/product";
import { variantIDs } from "@/lib/variables/variables";

namespace productVariantsModel{
    export const getOptions = ( skuIDs: any, type: 'color' | 'size'): {_id: any, value: any, caption: any}[] => {
        if (!skuIDs || !skuIDs.length) return []
        let results: any = {}
        const variantID = variantIDs[type]._id
        skuIDs.filter((el: any) => el.options.find((item: any) => item.variantID === variantID)).forEach((element: any) => {
            const target = element.options.find((color: any) => color.variantID === variantID)
            results[target.caption] = {
                _id: target?._id,
                value: target?.value,
                caption: target?.caption
            }
        });
        return Object.keys(results).length ? Object.values(results) : []
    }
    export const skuIDsMatchColor = (skuIDs: ISku[], color: string) => skuIDs.filter((sku: any) => sku?.options.find((options: any) => options.caption === color)).map((el: any) => el?.options.find((opt: any) => opt.variantID === variantIDs.size._id)).map((el: any) => el?.caption)
}
export default productVariantsModel