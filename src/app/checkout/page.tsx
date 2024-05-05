"use client";
import { useEffect, useState } from "react";
import CheckoutPageContext, { ICheckoutState, initialCheckout } from "./context";
import useAppCheckout from "@/functions/hooks/checkout/useAppCheckout";
import checkoutPageModel from "./model";
import CheckoutAddress from "./parts/forms/address/checkout-address";
import CheckoutShipping from "./parts/forms/shipping/checkout-shipping";
import L_Checkout from "@/components/loading/checkout";
import CheckoutSummary from "./parts/summary/checkout-summary";
import CheckoutPayment from "./parts/forms/payment/checkout-payment";
import useAppStore from "@/lib/stores/app/appStore";
import { useRouter } from "next/navigation";

function CheckoutPage() {
    const [States, setStates] = useState<ICheckoutState>(initialCheckout);
    const router = useRouter()
    const { status } = useAppCheckout();
    const { states: { cart } } = useAppStore()
    const { currentStep } = checkoutPageModel;
    const updateStates = (key: string, value: any) => setStates((prev: ICheckoutState) => ({ ...prev, [key]: value }));
    const steps = { loading: { form: <L_Checkout /> }, address: { form: <CheckoutAddress /> }, shipping: { form: <CheckoutShipping /> }, payment: { form: <CheckoutPayment></CheckoutPayment> } };
    useEffect(() => { cart?._id ? updateStates("step", currentStep(status)) : router.push("/") }, [cart.items]);
    return (
        <CheckoutPageContext.Provider value={{ states: States, mehtods: { updateStates } }}>
            {cart?._id && <main className="container flex items-start justify-between gap-12 pt-20">
                <div className="min-w-[70%]">{steps[States.step]?.form}</div>
                <div className="min-w-[30%] sticky left-0 top-24"><CheckoutSummary/></div>
            </main>}
        </CheckoutPageContext.Provider>
    );
}

export default CheckoutPage;
