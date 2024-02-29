import { AppButton, AppDotLabel, AppInput, AppSeparator, AppTypography } from "@/components/shared";
import useAppStore from "@/lib/stores/app/appStore";
import { cn } from "@/lib/utils/cn/cn";
import { app_vertical } from "@/lib/variables/variables";
import { roboto } from "@/styles/fonts";
import { SummaryEachProduct, SummaryFooter, SummaryGiftCardForm } from "./parts";

const CheckoutSummary = () => {
    const { states: { cart: { items, canApplyGiftCard, totalCart } } } = useAppStore();
    return (
        <section className={cn(app_vertical, "border rounded-sm p-6 gap-6 w-full")}>
            <h1 className={cn("font-semibold text-base text-foreground text-left w-full", roboto.className)}>Order Summary</h1>
            <div className={cn(app_vertical, "gap-6 w-full")}>{items?.map(({ product, options, totals, _id }) => <SummaryEachProduct key={_id} product={product} options={options} totals={totals} />)}</div>
            <AppSeparator/>
            <SummaryGiftCardForm canApplyGiftCard={canApplyGiftCard || false}/>
            <AppSeparator/>
            <SummaryFooter totalCart={totalCart}/>
        </section>
    );
};

export default CheckoutSummary;
