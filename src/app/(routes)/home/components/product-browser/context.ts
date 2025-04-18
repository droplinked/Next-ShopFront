import { createContext } from "react";

export interface IExploreState {
    search: string;
    price: [number, number];
}

export const initialExploreState: IExploreState = {
    search: "",
    price: [0, 1000],
};

interface IProductBrowserContext {
    states: IExploreState;
    methods: { updateStates: (key: string, value: any) => void };
}
const ProductBrowserContext = createContext<IProductBrowserContext>({
    states: initialExploreState,
    methods: { updateStates: () => {} },
});

export default ProductBrowserContext;
