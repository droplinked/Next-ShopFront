import { Partialize } from "@/types/custom/customize";
import { TokenTypes } from "@/types/enums/web3/web3";
import { createContext } from "react";

export interface ICheckoutState {
    step: "loading" | "address" | "shipping" | "payment";
    selected_method: {
        id: string; 
        name: any | "";
        token?: any ;
        enum_number?: number;
        chainId?: string;
    };
    stripe: { client_secret: string; orderID: string };
    submitting: boolean;
}

// Initial state values
export const initialCheckout: ICheckoutState = {
  step: 'loading',
  selected_method: { id: '', name: '', enum_number: -1 },
  stripe: { client_secret: '', orderID: '' },
  submitting: false,
};

// Define context interface
interface ICheckoutContext {
    states: ICheckoutState;
    methods: {
        updateStates: <K extends keyof ICheckoutState>(
            key: K,
            value: ICheckoutState[K]
        ) => void;
    };
}

const CheckoutPageContext = createContext<ICheckoutContext>({
    states: initialCheckout,
    methods: {
        updateStates: () => {}, 
    },
});

export default CheckoutPageContext;