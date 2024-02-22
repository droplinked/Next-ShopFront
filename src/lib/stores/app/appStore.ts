import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { APP_DEVELOPMENT } from "@/lib/variables/variables";
import { ICart } from "./interfaces/cart";
import { IAppStore, IUpdateState } from "./interface";
import { IShop, initialShop } from "./interfaces/shop";

const states = (set: any): IAppStore => ({
    states: { cart: {} as ICart, user: null, shop: initialShop },
    methods: {
        updateState: ({ state, value }: IUpdateState) => {
            set((prev: IAppStore) => ({ ...prev, states: { ...prev.states, [state]: value } }));
        },
    },
});

export const appStorePersistName = "appStore";

const _persist = persist(states, {
    name: appStorePersistName,
    partialize: (state) => ({
        states: state.states,
    }),
});

const useAppStore = APP_DEVELOPMENT ? create<IAppStore>()(devtools(_persist, { name: "droplinked" })) : create<IAppStore>()(_persist);

export default useAppStore;
