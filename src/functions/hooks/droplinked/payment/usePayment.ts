import { checkout_crypto_payment_service, get_stripe_client_secret_service, submit_order_service } from "@/lib/apis/checkout/service";
import useAppStore from "@/lib/stores/app/appStore";
import { Partialize } from "@/types/custom/customize";
import { CryptoPaymentTypes, PaymentTypes, TokenTypes } from "@/types/enums/web3/web3";
import { FormEvent, useState, useTransition } from "react";
import { getNetworkProvider } from "../utils/chains/chainProvider";
import { Network } from "../utils/chains/Chains";
import { APP_DEVELOPMENT } from "@/lib/variables/variables";
import { useRouter } from "next/navigation";
import { ICheckoutState } from "@/app/checkout/context";
import { PopupState } from "material-ui-popup-state/hooks";

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

    const stripe = async (updateStates: (key: string, value: any) => void, dialogState: PopupState) => {
        await get_stripe_client_secret_service({ cartId: _id, email })
            .then((res) => updateStates("stripe", res))
            .finally(() => transition("submitting", false));
    };

    const submit = async (form_event: FormEvent<HTMLFormElement>, {selected_method}: Pick<ICheckoutState, "selected_method">, updateStates: (key: string, value: any) => void, dialogState: PopupState) => {
        form_event.preventDefault();
        transition("submitting", true);
        if (selected_method?.name === "") return;
        if (selected_method?.name === "STRIPE") return await stripe(updateStates, dialogState);
        return await crypto_payment({selected_method})
    };

    const crypto_payment = async ({selected_method: {name: paymentType, enum_number, token}}: Pick<ICheckoutState, "selected_method">) => {
        if(paymentType === "" || paymentType === "STRIPE") return
        const sender: string = await (await getNetworkProvider(enum_number, APP_DEVELOPMENT ? Network.TESTNET : Network.MAINNET, "").walletLogin())[paymentType === "CASPER" ? "publicKey" : "address"];
        let checkout = await (await checkout_crypto_payment_service({ cartId: _id, paymentType, token, email, walletAddress: sender }));
        console.log(checkout)
        if (checkout) {
            const paymentResult = getNetworkProvider(enum_number, APP_DEVELOPMENT ? Network.TESTNET : Network.MAINNET, sender);
            const payment = await paymentResult?.payment(checkout?.paymentData);
            console.log(payment, payment.cryptoAmount,parseInt(payment.cryptoAmount?.hex), parseInt(payment?.cryptoAmount?.hex).toString() )
            await submit_order_service({
                chain: paymentType.toLowerCase(),
                deploy_hash: payment.deploy_hash,
                orderID: checkout?.orderID,
                cryptoAmount: parseInt(payment?.cryptoAmount),
            }).finally(() => {
                transition("submitting", false);
                router.push(`/checkout/${checkout?.orderID}`);
            });
        }
       
    };

    return { stripe, submit, payment_states, crypto_payment };
}
