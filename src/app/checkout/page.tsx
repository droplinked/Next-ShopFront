'use client'
import { useEffect, useState } from "react";
import CheckoutPageContext, { ICheckoutState, initialCheckout } from "./context";
import useAppCheckout from "@/functions/hooks/checkout/useAppCheckout";
import checkoutPageModel from "./model";
import CheckoutAddress from "./parts/forms/address/checkout-address";
import CheckoutShipping from "./parts/forms/shipping/checkout-shipping";

function CheckoutPage() {
    const [States, setStates] = useState<ICheckoutState>(initialCheckout);
    const { status } = useAppCheckout();
    const { currentStep } = checkoutPageModel;
    const updateStates = (key: string, value: any) => setStates((prev: ICheckoutState) => ({ ...prev, [key]: value }));
    const steps = { address: { form: <CheckoutAddress/> }, shipping: { form: <CheckoutShipping/> }, payment: { form: <></> } };
    useEffect(() => { updateStates('step', currentStep(status)) },[status])
    return (
        <CheckoutPageContext.Provider value={{ states: States, mehtods: { updateStates } }}>
            <div className="container">
                <div>{steps['shipping']?.form}</div>
                {/* <div>summary</div> */}
            </div>
        </CheckoutPageContext.Provider>
    );
}

export default CheckoutPage;
