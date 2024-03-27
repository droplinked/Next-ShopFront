import { AppLinkButton } from "@/components/shared";
import useAppStore from "@/lib/stores/app/appStore";
import { cn } from "@/lib/utils/cn/cn";
import { app_center, app_vertical } from "@/lib/variables/variables";
import { useFormik } from "formik";
import React from "react";
import EachPaymentRadio from "./parts/radio/each-payment-radio";
import useWeb3Hook from "@/functions/hooks/droplinked/web3/useWeb3";

const CheckoutPayment = () => {
    const {
        states: {
            shop: { paymentMethods },
        },
    } = useAppStore();
    const { payment } = useWeb3Hook();

    const { values, setValues, handleSubmit, isSubmitting, setSubmitting } = useFormik({ initialValues: {}, enableReinitialize: true, validateOnChange: false, onSubmit: () => {} });

    return (
        <form className={cn(app_vertical, "gap-6")} onSubmit={handleSubmit}>
            <div className={cn(app_vertical, "border rounded-sm p-6 gap-6 w-full")}>
                {payment.map((method, index) => (
                    <EachPaymentRadio key={index} method={method} />
                ))}
            </div>
            <div>
                <AppLinkButton disabled={isSubmitting} href={"/"} appButtonProps={{ appVariant: "filled", appClassName: cn(app_center, "rounded-sm py-3 px-4 text-sm font-normal") }}>
                    Back to shop
                </AppLinkButton>
            </div>
        </form>
    );
};

export default CheckoutPayment;
