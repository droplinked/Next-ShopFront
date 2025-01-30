import { Partialize } from "@/types/custom/customize";
import { PaymentTypes, TokenTypes } from "@/types/enums/web3/web3";
import { createContext } from "react";

export interface ICheckoutState {
    step: "loading" | "address" | "shipping" | "payment";
    selected_method: {
        name: any | "";
        token?: keyof Partialize<TokenTypes> ;
        enum_number?: number;
        chainId?: string;
    };
    stripe: { client_secret: string; orderID: string };
    submitting: boolean;
}

// Initial state values
export const initialCheckout: ICheckoutState = {
    step: "loading",
    selected_method: { name: "", enum_number: -1 },
    stripe: { client_secret: "", orderID: "" },
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

// Create context with default implementation
const CheckoutPageContext = createContext<ICheckoutContext>({
    states: initialCheckout,
    methods: {
        updateStates: () => {}, // Default implementation for updateStates
    },
});

export default CheckoutPageContext;