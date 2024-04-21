import { AppRadioInput, AppTypography } from "@/components/shared";
import { cn } from "@/lib/utils/cn/cn";
import { app_center, app_vertical } from "@/lib/variables/variables";
import { IEachPaymentRadio } from "./interface";
import useAppStore from "@/lib/stores/app/appStore";
import AppShow from "@/components/shared/show/AppShow";
import AppWalletIcons from "@/assets/icons/wallets/AppWalletIcons";
import { useContext } from "react";
import CheckoutPageContext from "@/app/checkout/context";

const EachPaymentRadio = ({ method, ...props }: IEachPaymentRadio) => {
    const { states: { shop: { paymentMethods } } } = useAppStore();
    const {states: { selected_method }, mehtods: { updateStates } } = useContext(CheckoutPageContext)
    const AppWalletIconsWithName = (Icon: any) => Icon ? <Icon /> : null;
    return (
        <AppShow
            show={{
                when: method.options.length > 0,
                then: (
                    <div className="self-stretch flex flex-col gap-4">
                        <AppTypography>{method.type}</AppTypography>
                        {paymentMethods.map((shop_payment_methods) =>
                            method.options.map((hook_option, key) => (
                                <AppShow
                                    key={key}
                                    show={{
                                        when: shop_payment_methods.isActive && hook_option && hook_option[shop_payment_methods.type],
                                        then: (
                                            <AppRadioInput key={key} checked={selected_method?.name === shop_payment_methods?.type} onChange={() => updateStates("selected_method", {name: shop_payment_methods?.type, token: hook_option?.[shop_payment_methods?.type]?.token, enum_number: hook_option?.[shop_payment_methods?.type]?.enum_number})} {...props}>
                                                <div className={cn(app_vertical, "w-full justify-start gap-2 -mt-1")}>
                                                    <div className={cn(app_center, "justify-between w-full")}>
                                                        <AppTypography>{hook_option?.[shop_payment_methods.type]?.label}</AppTypography>
                                                    </div>
                                                    <div className={cn(app_center, "justify-start w-full gap-1")}>
                                                        <AppTypography appClassName="font-normal text-[#878787]">{hook_option?.[shop_payment_methods?.type]?.description}</AppTypography>
                                                        {AppWalletIconsWithName(hook_option?.[shop_payment_methods?.type]?.icon?.light)}
                                                    </div>
                                                </div>
                                            </AppRadioInput>
                                        ),
                                    }}
                                />
                            ))
                        )}
                    </div>
                ),
            }}
        />
    );
};

export default EachPaymentRadio;
