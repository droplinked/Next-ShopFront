import { AppLinkButton, AppTypography } from "@/components/ui";
import useAppStore from "@/lib/stores/app/appStore";
import { cn } from "@/lib/utils/cn/cn";
import { app_center, app_vertical } from "@/lib/variables/variables";
import { useFormik } from "formik";
import React from "react";
import PaymentMethodOption from "./components/payment-method-option";


const CheckoutPayment = () => {
    const {
        states: {
            shop: { paymentMethods }
        }
    } = useAppStore();

    // Separate Fiat and Crypto payments
    const fiatPayments = paymentMethods?.filter((method) => method.type === "STRIPE");
    const cryptoPayments = paymentMethods?.filter((method) => method.type !== "STRIPE");

    const { handleSubmit, isSubmitting } = useFormik({
        initialValues: {},
        enableReinitialize: true,
        validateOnChange: false,
        onSubmit: () => {}
    });

    return (
        <form className={cn(app_vertical, "gap-6")} onSubmit={handleSubmit}>
            <div className={cn(app_vertical, "border rounded-sm  gap-6 w-full p-4")}>
                <AppTypography className="font-bold text-lg w-full">Payment Method</AppTypography>

                {/* Fiat Payments */}
                {fiatPayments?.length > 0 && (
                    <div className="flex flex-col gap-4 w-full px-6">
                        <AppTypography appClassName="font-medium text-base">Fiat</AppTypography>
                        {fiatPayments.map((method, index) => (
                            <PaymentMethodOption key={index} method={method} />
                        ))}
                    </div>
                )}

                {/* Crypto Payments */}
                {cryptoPayments?.length > 0 && (
                    <div className="flex flex-col gap-4  w-full px-6">
                        <AppTypography appClassName="font-medium text-base">Crypto</AppTypography>
                        {cryptoPayments.map((method, index) => (
                            <PaymentMethodOption key={index} method={method} />
                        ))}
                    </div>
                )}
            </div>

            <div>
                <AppLinkButton
                    disabled={isSubmitting}
                    href={"/"}
                    appButtonProps={{
                        appVariant: "filled",
                        appClassName: cn(app_center, "rounded-sm py-3 px-4 text-sm font-normal")
                    }}
                >
                    Back to shop
                </AppLinkButton>
            </div>
        </form>
    );
};

export default CheckoutPayment;

