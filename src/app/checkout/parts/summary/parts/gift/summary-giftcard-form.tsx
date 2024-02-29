import AppIcons from "@/assets/AppIcons";
import { AppButton, AppInput } from "@/components/shared";
import { ICart } from "@/types/interfaces/cart/cart";
import { Form, Formik } from "formik";
import React from "react";

const SummaryGiftCardForm = ({ canApplyGiftCard }: Pick<ICart, "canApplyGiftCard">) => <Formik initialValues={{ code: "" }} onSubmit={() => {}}>{({ values, dirty, isSubmitting, handleChange }) => <Form><AppInput placeholder="Enter gift card or discount code" value={values.code} name="code" id="code" left={<AppIcons.Discount />} right={<AppButton type="submit" loading={isSubmitting} disabled={!canApplyGiftCard || !dirty}>Apply</AppButton>}onChange={handleChange}/></Form>}</Formik>;
export default SummaryGiftCardForm;
