import { createContext } from "react";

export interface ICheckoutState {
    payment: string | null;
    clientSecret: string | null;
    loading: boolean;
    step: 'address' | 'shipping' | 'payment'
}

export const initialCheckout: ICheckoutState = {
    payment: null,
    clientSecret: null,
    loading: false,
    step: 'address',
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
