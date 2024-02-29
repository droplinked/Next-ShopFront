"use client";
import { useCallback, useEffect, useState } from "react";
import ProductContext, { IProductClientState, initialProductClientState } from "./context";
import productClientModel from "./model";
import { IProduct } from "@/types/interfaces/product/product";
import { AddToCart, ProductColors, ProductPrice, ProductQuantity, ProductSizes } from "./parts";

const ProductClient = ({ product }: { product: IProduct }) => {
    const [States, setStates] = useState<IProductClientState>(initialProductClientState);
    const { getFirstOption, findSkuAsOption } = productClientModel;
    const updateState = (key: string, value: any) => setStates((prev: IProductClientState) => ({ ...prev, [key]: value }));
    const updateOption = (key: string, value: any) => setStates((prev: IProductClientState) => ({ ...prev, option: { ...prev.option, [key]: value } }));
    const initialOptions = useCallback((data: IProduct) =>  setStates((prev: IProductClientState) => ({ ...prev, product: product, option: { quantity: prev.option.quantity, ...getFirstOption(data?.skuIDs[0]) }})), [product])
    useEffect(() => updateState("sku", States?.product?.product_type === "DIGITAL" ? States?.product?.skuIDs[0] : findSkuAsOption({ color: States.option.color, size: States.option.size, skuIDs: States.product?.skuIDs })), [States.option, States.product]);
    useEffect(() => initialOptions(product), [product]);

    return (
        <ProductContext.Provider value={{ states: States, methods: { updateOption, updateState } }}>
            <div className="flex flex-col gap-9"><ProductPrice /><ProductColors/><ProductSizes/><ProductQuantity/><AddToCart/></div>
        </ProductContext.Provider>
    );
};

export default ProductClient;
