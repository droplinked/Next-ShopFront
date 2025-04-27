import { AppLinkButton, AppTypography } from "@/components/ui";
import useAppStore from "@/lib/stores/app/appStore";
import { cn } from "@/lib/utils/cn/cn";
import { app_center, app_vertical } from "@/lib/variables/variables";
import { useFormik } from "formik";
import React, { useEffect, useState } from "react";
import PaymentMethodOption from "./components/PaymentMethodOption";
import { getPaymentMethodsService } from "@/services/cart/service";

// Define the interface for payment methods from API
interface IPaymentMethodResponse {
    type: string;
    label: string;
    stripeType?: string;
    token?: string;
    isCustom?: boolean;
    icon?: string;
    chainId?: string;
}

const CheckoutPayment = () => {
    const {
        states: {
            cart
        }
    } = useAppStore();
    
    const [paymentMethods, setPaymentMethods] = useState<IPaymentMethodResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch payment methods when component mounts
    useEffect(() => {
        const fetchPaymentMethods = async () => {
            if (cart && cart._id) {
                setLoading(true);
                try {
                    const response = await getPaymentMethodsService({ cartId: cart._id });
                    setPaymentMethods(response);
                    setError(null);
                } catch (err) {
                    console.error("Failed to fetch payment methods:", err);
                    setError("Unable to load payment methods. Please try again later.");
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchPaymentMethods();
    }, [cart]);

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

                {loading && (
                    <div className="flex items-center justify-center p-4">
                        <p>Loading payment methods...</p>
                    </div>
                )}

                {error && (
                    <div className="flex items-center justify-center p-4 text-red-500">
                        <p>{error}</p>
                    </div>
                )}

                {/* Fiat Payments */}
                {fiatPayments?.length > 0 && (
                    <div className="flex flex-col gap-4 w-full px-6">
                        <AppTypography appClassName="font-medium text-base">Fiat</AppTypography>
                        {fiatPayments.map((method, index) => (
                            <PaymentMethodOption 
                                key={index} 
                                method={{
                                    type: method.type,
                                    displayName: method.label,
                                    isActive: true,
                                    stripeType: method.stripeType,
                                    supportedChains: []
                                }} 
                            />
                        ))}
                    </div>
                )}

                {/* Crypto Payments */}
                {cryptoPayments?.length > 0 && (
                    <div className="flex flex-col gap-4  w-full px-6">
                        <AppTypography appClassName="font-medium text-base">Crypto</AppTypography>
                        {cryptoPayments.map((method, index) => (
                            <PaymentMethodOption 
                                key={index} 
                                method={{
                                    type: method.type,
                                    displayName: method.label,
                                    isActive: true,
                                    token: method.token,
                                    chainId: method.chainId,
                                    supportedChains: []
                                }} 
                            />
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

