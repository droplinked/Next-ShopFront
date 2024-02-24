import { useContext, useMemo } from "react"
import ProductContext from "../../../context"
import productVariantsModel from "../model"
import VariantsLabel from "../parts/label/variants-label"

function ProductColors() {
    const { states: { product, option: { color } }, methods: { updateOption } } = useContext(ProductContext)
    const colors = useMemo(() => productVariantsModel.getOptions(product?.skuIDs, "color" ), [product])

    return colors.length ? (
                <div className="flex flex-col gap-6">
                    <VariantsLabel label="Color" current={color || ""}/>
                    <div className="flex flex-wrap gap-2.5">{colors.map((el, key) => (<div key={key} className="border-[1.5px] border-border rounded-sm cursor-pointer bg-transparent p-1.5 w-12 h-12" style={{borderColor: el.caption === color && el.value}} onClick={() => updateOption('color', el.caption)}><div className="border rounded w-full h-full" style={{backgroundColor: el?.value}}/></div>))}</div>
                </div>
            ) : null
    
}

export default ProductColors