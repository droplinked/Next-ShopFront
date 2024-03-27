import { get_stripe_client_secret_service } from "@/lib/apis/checkout/service"
import useAppStore from "@/lib/stores/app/appStore"
import { Partialize } from "@/types/custom/customize"
import { PaymentTypes } from "@/types/enums/web3/web3"
import { FormEvent, useState, useTransition } from "react"

export function usePayment() {
    const { states: { cart: { _id, email } } } = useAppStore();
    const [payment_states, set_payment_states] = useState<{ submitting: boolean }>({ submitting: false });
    const [pending, start_stransition] = useTransition();
    const transition = (key: string, value: any) => start_stransition(() => {set_payment_states((prev) => ({...prev, [key]: value}) )})
    const stripe = async(updateStates: (key: string, value: any) => void) => { await get_stripe_client_secret_service({ cartId: _id, email }).then((res) => updateStates("stripe", res)).finally(()=> transition('submitting', false))}
    const submit = async (form_event: FormEvent<HTMLFormElement>, type: keyof Partialize<PaymentTypes> | "", updateStates: (key: string, value: any) => void) => {
        form_event.preventDefault();
        transition("submitting", true);
        if (type === "") return;
        if (type === "STRIPE") await stripe(updateStates);
    };

    return { stripe, submit, payment_states };
}
