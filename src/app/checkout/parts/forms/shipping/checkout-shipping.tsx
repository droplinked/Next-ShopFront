import AppIcons from "@/assets/AppIcons";
import AppButton from "@/components/shared/button/AppButton";
import AppLinkButton from "@/components/shared/button/link/AppLinkButton";
import { AppInput } from "@/components/shared/input/AppInput";
import useAppStore from "@/lib/stores/app/appStore";
import { cn } from "@/lib/utils/cn/cn";
import { app_center, app_vertical } from "@/lib/variables/variables";
import { Form, Formik, useFormik } from "formik";
import Link from "next/link";
import { useEffect, useState } from "react";
import shippingModel from "./model";
import EachShippingRadio from "./radio/each-shipping-radio";
import ShippingGroupProducts from "./products/shipping-group-products";
import { toast } from "sonner";
import useAppCart from "@/functions/hooks/cart/useAppCart";
import { IShippingRates } from "@/lib/apis/checkout/interface";

const CheckoutShipping = () => {
    const { states: { cart } } = useAppStore();
    const {add_shipping} = useAppCart()
    const { initialShippingValues } = shippingModel;
    return (
        <Formik initialValues={initialShippingValues(cart?.shippings)} enableReinitialize validateOnChange={false} onSubmit={ async (values) => toast.promise(async () => await add_shipping({cartId: cart._id, rates: values}), {loading: 'Adding shipping to cart...', success:`Successfully added shipping(s) to your cart`, error: 'Something went wrong' })}>
            {({ values, setValues, isSubmitting }) => (
                <Form className={cn(app_vertical, "gap-6")}>
                    <div className={cn(app_vertical, "border rounded-sm p-6 gap-6 w-full")}>
                        {cart?.shippings.map((shipping, index) => (
                            <div key={shipping.groupId} className={cn(app_vertical, "w-full gap-4")}>
                                <ShippingGroupProducts groupId={shipping.groupId}/>
                                {shipping.data.map((data, idx) => <EachShippingRadio key={`${data.id}`} shippingData={data} checked={values[index].shipmentId === data.id && values[index].groupId === shipping.groupId} onChange={() => setValues(prev => prev.map((item, idx) => idx === index ? { groupId: shipping.groupId, shipmentId: data.id } : item))}/>)}
                            </div>
                        ))}
                    </div>
                    <div className={cn(app_center, "w-full justify-between")}>
                        <AppLinkButton disabled={isSubmitting} href={"/"} appButtonProps={{ appVariant: "filled", appClassName: cn(app_center, "rounded-sm py-3 px-4 text-sm font-normal") }}>
                            Back to shop
                        </AppLinkButton>
                        <AppButton loading={isSubmitting} disabled={values.length !== cart?.shippings?.length || isSubmitting} appClassName="py-3 pr-4 pl-9 rounded-sm" type="submit" hasIcon>
                            Next
                            <AppIcons.Arrow className="stroke-disabled-foreground" />
                        </AppButton>
                    </div>
                </Form>
            )}
        </Formik>
    );
};

export default CheckoutShipping;
