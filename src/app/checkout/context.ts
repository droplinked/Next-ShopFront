import { Partialize } from "@/types/custom/customize";
import { PaymentTypes } from "@/types/enums/web3/web3";
import { createContext } from "react";

export interface ICheckoutState {
    step: "loading" | "address" | "shipping" | "payment";
    selected_method: keyof Partialize<PaymentTypes> | "";
    stripe: { client_secret: string | null; orderID: string | null };
    submitting: boolean;
}

export const initialCheckout: ICheckoutState = {
    step: "loading",
    selected_method: "",
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
