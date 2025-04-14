export interface IStripeCheckoutForm {
    success: () => void;
    cancel: () => void;
    amount?: number;
}

export interface IAppStripe extends IStripeCheckoutForm {
    clientSecret: string;
}
