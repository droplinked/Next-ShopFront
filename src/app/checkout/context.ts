import { createContext } from "react";

export interface ICheckoutState {
    step: "loading" | "address" | "shipping" | "payment";
}

export const initialCheckout: ICheckoutState = {
    step: "loading",
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
