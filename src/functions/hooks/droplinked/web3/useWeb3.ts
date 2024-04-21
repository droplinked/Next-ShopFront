import AppWalletIcons from "@/assets/icons/wallets/AppWalletIcons";
import { ILoginDroplinked, IPaymentDroplinked, PaymentDroplinkedOptions } from "./interfaces";
import useAppStore from "@/lib/stores/app/appStore";
import { useMemo } from "react";

function useWeb3Hook() {    

    const { states: { shop: { paymentMethods } } } = useAppStore()
    
    const login: ILoginDroplinked = {
        LEATHER: { wallet: "Leather", chains: { STACK: { caption: "Stacks", method: () => {}, icon: { dark: AppWalletIcons.UnstoppablePayment, light: AppWalletIcons.UnstoppablePayment } } } },
        CASPER: {
            wallet: "Casper",
            chains: { CASPER: { caption: "Casper Wallet - Casper", method: () => {}, icon: { dark: AppWalletIcons.UnstoppablePayment, light: AppWalletIcons.UnstoppablePayment } } },
        },
        MULTIWALLET: {
            wallet: "Multi wallet",
            chains: { UNSTOPPABLEDOMAIN: { caption: "Unstoppabledomains", method: () => {}, icon: { dark: AppWalletIcons.UnstoppablePayment, light: AppWalletIcons.UnstoppablePayment } } },
        },
        XUMM: { wallet: "Xumm", chains: { XUMM: { caption: "XRPL", method: () => {}, icon: { dark: AppWalletIcons.UnstoppablePayment, light: AppWalletIcons.UnstoppablePayment } } } },
        METAMASK: {
            wallet: "Metamask",
            chains: {
                BASE: { caption: "Base", method: () => {}, icon: { dark: AppWalletIcons.UnstoppablePayment, light: AppWalletIcons.UnstoppablePayment } },
                POLYGON: { caption: "Polygon", method: () => {}, icon: { dark: AppWalletIcons.UnstoppablePayment, light: AppWalletIcons.UnstoppablePayment } },
                XRPLSIDECHAIN: { caption: "XRPL", method: () => {}, icon: { dark: AppWalletIcons.UnstoppablePayment, light: AppWalletIcons.UnstoppablePayment } },
                BINANCE: { caption: "Binance", method: () => {}, icon: { dark: AppWalletIcons.UnstoppablePayment, light: AppWalletIcons.UnstoppablePayment } },
                NEAR: { caption: "Near", method: () => {}, icon: { dark: AppWalletIcons.UnstoppablePayment, light: AppWalletIcons.UnstoppablePayment } },
                LINEA: { caption: "Linea", method: () => {}, icon: { dark: AppWalletIcons.UnstoppablePayment, light: AppWalletIcons.UnstoppablePayment } },
            },
        },
    };

    const payment: IPaymentDroplinked[] = [
        {
            type: "Fiat",
            options: [
                {STRIPE: { label: "Credit Card", description: "Pay with your credit card using", icon: { light: AppWalletIcons.StripePayment, dark: AppWalletIcons.StripePayment } } },
            ],
        },
        {
            type: "Crypto",
            options: [
                {CASPER: { label: "Casper Wallet", description: "Make payment directly using", icon: { light: AppWalletIcons.CasperPayment, dark: AppWalletIcons.CasperPayment }, token: "CSPR", enum_number: 0 } },
                {POLYGON: { label: "Metamask Wallet", description: "Make payment directly using", icon: { light: AppWalletIcons.PolygonPayment, dark: AppWalletIcons.PolygonPayment }, token: "MATIC", enum_number: 1 } },
                {BINANCE: { label: "Metamask Wallet", description: "Make payment directly using", icon: { light: AppWalletIcons.BinancePayment, dark: AppWalletIcons.BinancePayment }, token: "BNB", enum_number: 2 } },
                {XRPLSIDECHAIN: { label: "Metamask Wallet", description: "Make payment directly using", icon: { light: AppWalletIcons.XrplSidechainPayment, dark: AppWalletIcons.XrplSidechainPayment }, token: "XRP", enum_number: 4 } },
                {RIPPLESIDECHAIN: { label: "Metamask Wallet", description: "Make payment directly using", icon: { light: AppWalletIcons.XrplSidechainPayment, dark: AppWalletIcons.XrplSidechainPayment }, token: "XRP", enum_number: 4 } },
                {NEAR: { label: "Metamask Wallet", description: "Make payment directly using", icon: { light: AppWalletIcons.NearPayment, dark: AppWalletIcons.NearPayment }, token: "NEAR", enum_number: 5 } },
                {BASE: { label: "Metamask Wallet", description: "Make payment directly using", icon: { light: AppWalletIcons.BasePayment, dark: AppWalletIcons.BasePayment }, token: "ETH", enum_number: 7 } },
                {LINEA: { label: "Metamask Wallet", description: "Make payment directly using", icon: { light: AppWalletIcons.LinaePayment, dark: AppWalletIcons.LinaePayment }, token: "ETH", enum_number: 8 } },
                {ETH: { label: "Metamask Wallet", description: "Make payment directly using", icon: { light: AppWalletIcons.ETHPayment, dark: AppWalletIcons.ETHPayment }, token: "ETH", enum_number: 9 } },
                {SOLANA: { label: "Phantom Wallet", description: "Make payment directly using", icon: { light: AppWalletIcons.SolanaPayment, dark: AppWalletIcons.SolanaPayment }, token: "MEW", enum_number: 10 } },
            ],
        },
    ];
    

    
    const serialized_payment_methods = useMemo(() => {
        const updated_payments = payment.map((general_payment_type) => {
            const updated_options = general_payment_type.options.map((option) => {
                const method_key = Object.keys(option)[0];
                const payment_method_match = paymentMethods.find((method) => method.type === method_key);
                if (payment_method_match) return payment_method_match ? { [method_key]: { ...option[method_key as keyof typeof option], ...payment_method_match } } : option;
            });
            return { ...general_payment_type, options: updated_options };
        });

        return updated_payments;
    }, [paymentMethods]); 
    
    

    return { login, payment };
}

export default useWeb3Hook;
