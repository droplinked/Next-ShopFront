import AppWalletIcons from "@/assets/icons/wallets/AppWalletIcons";
import { ILoginDroplinked, IPaymentDroplinked, PaymentDroplinkedOptions } from "./interfaces";
import useAppStore from "@/lib/stores/app/appStore";
import { useMemo } from "react";
import { payment_methods_serializer } from "@/lib/utils/sz/serializers";
import useWeb3HookModel from "./model";

function useWeb3Hook() {
    const {
        states: {
            shop: { paymentMethods },
        },
    } = useAppStore();

    const { display_options } = useWeb3HookModel;

    const login: ILoginDroplinked = {
        MULTIWALLET: {
            wallet: "Multi wallet",
            chains: { UNSTOPPABLEDOMAIN: { caption: "Unstoppabledomains", method: () => {}, icon: { dark: AppWalletIcons.UnstoppablePayment, light: AppWalletIcons.UnstoppablePayment } } },
        },
        XUMM: { wallet: "Xumm", chains: { XUMM: { caption: "XRPL", method: () => {}, icon: { dark: AppWalletIcons.XrplSidechainPayment, light: AppWalletIcons.XrplSidechainPayment } } } },
        METAMASK: {
            wallet: "Metamask",
            chains: {
                BASE: { caption: "Base", method: () => {}, icon: { dark: AppWalletIcons.BasePayment, light: AppWalletIcons.BasePayment } },
                POLYGON: { caption: "Polygon", method: () => {}, icon: { dark: AppWalletIcons.PolygonPayment, light: AppWalletIcons.PolygonPayment } },
                XRPLSIDECHAIN: { caption: "XRPL", method: () => {}, icon: { dark: AppWalletIcons.XrplSidechainPayment, light: AppWalletIcons.XrplSidechainPayment } },
                BINANCE: { caption: "Binance", method: () => {}, icon: { dark: AppWalletIcons.BinancePayment, light: AppWalletIcons.BinancePayment } },
                NEAR: { caption: "Near", method: () => {}, icon: { dark: AppWalletIcons.NearPayment, light: AppWalletIcons.NearPayment } },
                LINEA: { caption: "Linea", method: () => {}, icon: { dark: AppWalletIcons.LinaePayment, light: AppWalletIcons.LinaePayment } },
            },
        },
    };
    const payment: IPaymentDroplinked[] = useMemo(() => {
        const serialized_payment_methods = payment_methods_serializer(paymentMethods);
        return [
            {
                type: "Crypto",
                options: serialized_payment_methods.map((serialized_method) => ({
                    [serialized_method.type]: {
                        label: serialized_method.title,
                        token: serialized_method.token,
                    },
                })),
            },
        ];
    }, []);

    return { login, payment };
}

export default useWeb3Hook;
