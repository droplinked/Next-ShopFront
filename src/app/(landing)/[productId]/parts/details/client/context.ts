import { IProduct, ISku, initialProductProps, initialSkuProps } from "@/types/interfaces/product/product";
import { createContext } from "react";

export interface IProductClientState {
    product: IProduct;
    option: { color: string | null; size: string | null; quantity: number };
    sku: ISku;
    ruleset: { loading: boolean; data: any };
}
export const initialProductClientState: IProductClientState = {
    product: initialProductProps,
    option: { color: null, size: null, quantity: 1 },
    sku: initialSkuProps,
    ruleset: { loading: false, data: false },
};

interface IProductContext {
    states: IProductClientState;
    methods: { updateState: Function; updateOption: Function };
}

const ProductContext = createContext<IProductContext>({
    states: initialProductClientState,
    methods: { updateOption: () => {}, updateState: () => {} },
});

export default ProductContext;
