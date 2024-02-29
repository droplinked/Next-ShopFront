import { ICart } from "@/types/interfaces/cart/cart";
import { IShop } from "@/types/interfaces/shop/shop";

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
        updateState: (props: IUpdateState) => any;
    };
}
