import { Partialize } from "@/types/custom/customize";
import { PaymentTypes, TokenTypes } from "@/types/enums/web3/web3";
import { createContext } from "react";

export interface ICheckoutState {
    step: "loading" | "address" | "shipping" | "payment";
    selected_method: {name: keyof Partialize<PaymentTypes> | "", token: keyof Partialize<TokenTypes> | "", enum_number: number}
    stripe: { client_secret: string | null; orderID: string | null };
    submitting: boolean;
}

export const initialCheckout: ICheckoutState = {
    step: "loading",
    selected_method: {name: "", token: "", enum_number: -1},
    stripe: { client_secret: null, orderID: null },
    submitting: false,
};

interface ICheckoutContext {
    states: ICheckoutState;
    mehtods: {
        updateStates: (key: string, value: any) => void;
        payment?: () => Promise<void>;
    };
}

const CheckoutPageContext = createContext<ICheckoutContext>({
    states: initialCheckout,
    mehtods: {
        updateStates: () => {},
        payment: async () => {},
    },
});

export default CheckoutPageContext;
