import AppIcons from "@/assets/AppIcons";
import { AppButton, AppInput } from "@/components/shared";
import { ICart } from "@/types/interfaces/cart/cart";
import { Form, Formik, useFormik } from "formik";
import React from "react";
import { initial_giftcard } from "../../../parts/schema/schema";
import { toast } from "sonner";
import useAppCart from "@/functions/hooks/cart/useAppCart";
import useAppStore from "@/lib/stores/app/appStore";

const SummaryGiftCardForm = () => {
    const { add_gift } = useAppCart();
    const { states: { cart } } = useAppStore();
    const { values, dirty, handleSubmit, handleChange, isSubmitting, setSubmitting } = useFormik({ initialValues: initial_giftcard, enableReinitialize: true, validateOnChange: true, onSubmit: (values) => { toast.promise( add_gift({ cartId: cart._id, code: values.code }).finally(() => setSubmitting(false)), { loading: "Adding giftcard to cart...", success: `Successfully applied`, error: "Something went wrong" })}});
    return <form onSubmit={handleSubmit}><AppInput value={values.code} name="code" id="code" onChange={handleChange} placeholder="Enter gift card or discount code" left={<AppIcons.Discount />} right={<AppButton type="submit" loading={isSubmitting} disabled={!cart?.canApplyGiftCard || !dirty || isSubmitting}>Apply</AppButton>}/></form>
};

export default SummaryGiftCardForm;
