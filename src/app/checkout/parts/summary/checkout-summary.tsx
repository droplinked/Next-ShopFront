import { AppButton, AppDialog, AppDotLabel, AppInput, AppProductSummary, AppSeparator, AppTypography } from "@/components/shared";
import useAppStore from "@/lib/stores/app/appStore";
import { cn } from "@/lib/utils/cn/cn";
import { app_vertical } from "@/lib/variables/variables";
import { roboto } from "@/styles/fonts";
import { SummaryFooter, SummaryGiftCardForm } from "./parts";
import PaymentModal from "./parts/modal/payment-modal";
import AppShow from "@/components/shared/show/AppShow";
import { useContext } from "react";
import CheckoutPageContext from "../../context";
import { usePayment } from "@/functions/hooks/droplinked/payment/usePayment";
import { usePopupState } from "material-ui-popup-state/hooks";

const CheckoutSummary = () => {
    const { states: { cart: { items, totalCart } } } = useAppStore();
    const {states: { selected_method, step, stripe }, mehtods: { updateStates } } = useContext(CheckoutPageContext)
    const dialogState = usePopupState({ variant: "popover", popupId: "droplinked-popup-popover" });
    const {submit, payment_states} = usePayment()
    return (
        <section className={cn(app_vertical, "self-stretch gap-6")}>
            <aside className={cn(app_vertical, "border rounded-sm p-6 gap-6 w-full")}>
                <h1 className={cn("font-semibold text-base text-foreground text-left w-full", roboto.className)}>Order Summary</h1>
                <div className={cn(app_vertical, "gap-6 w-full")}>
                    {items?.map(({ product, options, totals, _id }) => (
                        <AppProductSummary
                            key={_id}
                            details={{ size: options?.size?.caption, color: options?.color?.caption, quantity: options?.quantity, priceItem: totals?.priceItem, image: product?.image, title: product?.title }}
                        />
                    ))}
                </div>
                <AppSeparator />
                <SummaryGiftCardForm />
                <AppSeparator />
                <SummaryFooter totalCart={totalCart} />
            </aside>
            <AppShow
                show={{
                    when: step === "payment",
                    then: (
                        <AppDialog
                            props={{
                                dialogState: dialogState,
                                trigger: <form onSubmit={(event) => submit(event, { selected_method }, updateStates, dialogState)} className="self-stretch"><AppButton type="submit" appClassName="w-full" appSize="lg" disabled={selected_method?.name === ""} loading={payment_states.submitting}>Pay ${totalCart?.totalPayment} USD</AppButton></form>,
                                content: { children: <PaymentModal stripe={stripe} /> },
                            }}
                        />
                    ),
                }}
            />
        </section>
    );
};

export default CheckoutSummary;
