import { checkout_crypto_payment_service, get_stripe_client_secret_service, submit_order_service } from "@/lib/apis/checkout/service";
import useAppStore from "@/lib/stores/app/appStore";
import { FormEvent, useState, useTransition } from "react";
import { APP_DEVELOPMENT } from "@/lib/variables/variables";
import { useRouter } from "next/navigation";
import { ICheckoutState } from "@/app/checkout/context";
import { PopupState } from "material-ui-popup-state/hooks";
import { getNetworkProvider, Network } from "@droplinked/wallet-connection"
export function usePayment() {
    const { states: { cart: { _id, email } } } = useAppStore();
    const router = useRouter();
    const [payment_states, set_payment_states] = useState<{ submitting: boolean }>({ submitting: false });
    const [pending, start_stransition] = useTransition();
    const transition = (key: string, value: any) => start_stransition(() => { set_payment_states((prev) => ({ ...prev, [key]: value })) });
    const submit = async (form_event: FormEvent<HTMLFormElement>, {selected_method}: Pick<ICheckoutState, "selected_method">, updateStates: (key: string, value: any) => void, dialogState: PopupState) => {
        form_event.preventDefault();
        if (selected_method?.name === "") return;
        return await crypto_payment({selected_method})
    }; 

    const crypto_payment = async ({selected_method: {name: paymentType, enum_number, token}}: Pick<ICheckoutState, "selected_method">) => {
        if(paymentType === "") return
        transition("submitting", true);
        const sender: string = await (await getNetworkProvider(enum_number, APP_DEVELOPMENT ? Network.TESTNET : Network.MAINNET, "")?.walletLogin())?.address
        let checkout = await (await checkout_crypto_payment_service({ cartId: _id, paymentType, token, email, walletAddress: sender }));
        if (checkout) {
            const paymentResult = getNetworkProvider(enum_number, APP_DEVELOPMENT ? Network.TESTNET : Network.MAINNET, sender);
            const payment = await paymentResult?.payment(checkout?.paymentData);
            await submit_order_service({
                chain: paymentType?.toLowerCase(),
                deploy_hash: payment?.deploy_hash,
                orderID: checkout?.orderID,
                cryptoAmount: parseInt(payment?.cryptoAmount),
            }).finally(() => {
                transition("submitting", false);
                router.push(`/checkout/${checkout?.orderID}`);
            });
        }
       
    };

    return { submit, payment_states, crypto_payment };
}
