import { ICart } from "./interfaces/cart";
import { IShop } from "./interfaces/shop";

export interface IUpdateState {
    state: string;
    value: any;
}

export interface IAppStore {
    states: {
        cart: ICart;
        user: any;
        shop: IShop;
    };
    methods: {
        updateState: (props: IUpdateState) => void;
    };
}
