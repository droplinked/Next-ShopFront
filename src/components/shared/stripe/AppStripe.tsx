import { loadStripe } from "@stripe/stripe-js";
import CheckoutForm from "./form/CheckoutForm";
import { IAppStripe } from "./interface";
import { Elements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(`${process.env.NEXT_PUBLIC_STRIPE_KEY}`);
const AppStripe = ({ clientSecret, amount, cancel, success }: IAppStripe) => <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "stripe" }}}><CheckoutForm cancel={cancel} success={success} amount={amount} /></Elements>
export default AppStripe;
