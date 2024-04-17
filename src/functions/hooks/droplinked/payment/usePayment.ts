import { checkout_crypto_payment_service, get_stripe_client_secret_service, submit_order_service } from "@/lib/apis/checkout/service";
import useAppStore from "@/lib/stores/app/appStore";
import { Partialize } from "@/types/custom/customize";
import { CryptoPaymentTypes, PaymentTypes } from "@/types/enums/web3/web3";
import { FormEvent, useState, useTransition } from "react";
import { getNetworkProvider } from "../utils/chains/chainProvider";
import { Network } from "../utils/chains/Chains";
import { APP_DEVELOPMENT } from "@/lib/variables/variables";
import { useRouter } from "next/router";

export function usePayment() {
    const {
        states: {
            cart: { _id, email },
        },
    } = useAppStore();
    const router = useRouter();
    const [payment_states, set_payment_states] = useState<{ submitting: boolean }>({ submitting: false });
    const [pending, start_stransition] = useTransition();
    const transition = (key: string, value: any) =>
        start_stransition(() => {
            set_payment_states((prev) => ({ ...prev, [key]: value }));
        });

    const stripe = async (updateStates: (key: string, value: any) => void) => {
        await get_stripe_client_secret_service({ cartId: _id, email })
            .then((res) => updateStates("stripe", res))
            .finally(() => transition("submitting", false));
    };

    const submit = async (form_event: FormEvent<HTMLFormElement>, type: keyof Partialize<PaymentTypes> | "", updateStates: (key: string, value: any) => void) => {
        form_event.preventDefault();
        transition("submitting", true);
        if (type === "") return;
        if (type === "STRIPE") await stripe(updateStates);
    };

    const _token: { [propname in keyof CryptoPaymentTypes]: { token: string; enum_number: number } } = {
        CASPER: { token: "CSPR", enum_number: 0 },
        POLYGON: { token: "MATIC", enum_number: 1 },
        BINANCE: { token: "BNB", enum_number: 2 },
        XRPLSIDECHAIN: { token: "XRP", enum_number: 4 },
        RIPPLESIDECHAIN: { token: "XRP", enum_number: 4 },
        NEAR: { token: "NEAR", enum_number: 5 },
        BASE: { token: "ETH", enum_number: 7 },
        LINEA: { token: "ETH", enum_number: 8 },
        ETH: { token: "ETH", enum_number: 9 },
    };

    const evm_payment = async (walletType: keyof Partialize<CryptoPaymentTypes>) => {
        const token_and_enum_number = _token[walletType];
        const sender: string = await (await getNetworkProvider(token_and_enum_number.enum_number, APP_DEVELOPMENT ? Network.TESTNET : Network.MAINNET, "").walletLogin())[walletType === "CASPER" ? "publicKey" : "address"];
        let checkout = await (await checkout_crypto_payment_service({ cartId: _id, paymentType: walletType, token: token_and_enum_number.token, email: email, walletAddress: sender })).data?.data;
        const paymentResult = getNetworkProvider(token_and_enum_number.enum_number, APP_DEVELOPMENT ? Network.TESTNET : Network.MAINNET, sender);
        const payment = await paymentResult?.payment(checkout?.paymentData);
        await submit_order_service({ chain: walletType.toLowerCase(), deploy_hash: payment.deploy_hash, orderID: checkout?.orderID, cryptoAmount: parseInt(payment.cryptoAmount).toString() }).finally(
            () => {
                router.push(`/checkout/${checkout?.orderID}`);
            }
        );
    };

    return { stripe, submit, payment_states, evm_payment };
}
