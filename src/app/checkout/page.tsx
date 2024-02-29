"use client";
import { useCallback, useEffect, useState } from "react";
import CheckoutPageContext, { ICheckoutState, initialCheckout } from "./context";
import useAppCheckout from "@/functions/hooks/checkout/useAppCheckout";
import checkoutPageModel from "./model";
import CheckoutAddress from "./parts/forms/address/checkout-address";
import CheckoutShipping from "./parts/forms/shipping/checkout-shipping";
import L_Checkout from "@/components/loading/checkout";
import CheckoutSummary from "./parts/summary/checkout-summary";

function CheckoutPage() {
    const [States, setStates] = useState<ICheckoutState>(initialCheckout);
    const { status } = useAppCheckout();
    const { currentStep } = checkoutPageModel;
    const updateStates = (key: string, value: any) => setStates((prev: ICheckoutState) => ({ ...prev, [key]: value }));
    const steps = { loading: { form: <L_Checkout /> }, address: { form: <CheckoutAddress /> }, shipping: { form: <CheckoutShipping /> }, payment: { form: <></> } };
    useEffect(() => { updateStates("step", currentStep(status)) }, [status]);
    return (
        <CheckoutPageContext.Provider value={{ states: States, mehtods: { updateStates } }}>
            <main className="container flex items-start justify-between gap-12">
                <div className="min-w-[70%]">{steps[States.step]?.form}</div>
                <div className="min-w-[30%] sticky left-0 top-0"><CheckoutSummary/></div>
            </main>
        </CheckoutPageContext.Provider>
    );
}

export default CheckoutPage;
