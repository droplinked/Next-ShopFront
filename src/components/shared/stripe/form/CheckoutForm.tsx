import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { useFormik } from 'formik'
import { toast } from 'sonner'
import { AppButton } from '../..'
import { boolean } from 'yup'
import { IStripeCheckoutForm } from '../interface'

function CheckoutForm({ success, cancel, amount }: IStripeCheckoutForm) {
    const stripe = useStripe();
    const elements = useElements();
    const { values, setFieldValue, handleSubmit, isSubmitting, setSubmitting } = useFormik({ initialValues: { complete: boolean }, enableReinitialize: true, validateOnChange: false, onSubmit: (values) => { if (!stripe || !elements || !values.complete) return; toast.promise( stripe.confirmPayment({ elements, redirect: "if_required" }).finally(() => { setSubmitting(false); success(); }), { loading: "Paying...", success: `Payment was successful`, error: "Something went wrong" }) } });
    return (
        <form onSubmit={handleSubmit} className='flex flex-col gap-6 w-full'>
            <PaymentElement onChange={(e) => setFieldValue('complete', e.complete)} />
            <div className="flex w-full gap-6">
                <div className="min-w-fit"><AppButton appClassName="rounded-sm w-full" appVariant="outlined" appSize="lg" onClick={cancel}>Discard</AppButton></div>
                <div className="w-full"><AppButton disabled={!values.complete} loading={isSubmitting} type="submit" appClassName="rounded-sm w-full" appVariant="filled" appSize="lg">Pay {amount ? `$${amount.toFixed(2)}` : ""}</AppButton></div>
            </div>
        </form>
    );
}
export default CheckoutForm