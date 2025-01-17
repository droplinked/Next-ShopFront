import CheckoutPageContext, { ICheckoutState } from '@/app/checkout/context';
import { checkoutCryptoPaymentService, fetchStripePaymentDetails, submitOrderService } from '@/lib/apis/checkout/service';
import useAppStore from '@/lib/stores/app/appStore';
import { APP_DEVELOPMENT } from '@/lib/variables/variables';
import { Chain, ChainWallet, DropWeb3, Network, Web3Actions } from 'droplinked-web3';
import { useRouter } from 'next/navigation';
import { useContext, useState, useTransition } from 'react';

/**
 * Custom hook for managing different payment methods including Stripe and Crypto payments.
 */
export function usePayment() {
    const {
        states: { cart }
    } = useAppStore();
    const router = useRouter();
    const { states, methods } = useContext(CheckoutPageContext);

    // State to track the payment submission process
    const [paymentState, setPaymentState] = useState<{ submitting: boolean }>({ submitting: false });

    // Initialize the Web3 instance for the current environment
    const web3 = new DropWeb3(APP_DEVELOPMENT ? Network.TESTNET : Network.MAINNET);

    // Transition handler to manage loading states during async operations
    const [isPending, startTransition] = useTransition();
    const updatePaymentState = (key: string, value: any) =>
        startTransition(() => setPaymentState(prev => ({ ...prev, [key]: value })));

    /**
     * Initiates the payment process based on the selected payment method (Stripe or Crypto).
     * @param selectedMethod - The selected payment method from checkout state.
     */
    const processPayment = async ({ selected_method }: Pick<ICheckoutState, 'selected_method'>) => {
        if (!selected_method?.name) return;

        if (selected_method.name === 'STRIPE') {
            return await processStripePayment();
        }

        return await processCryptoPayment({ selected_method });
    };

    /**
     * Handles the Stripe payment process by fetching payment details and updating the context.
     */
    const processStripePayment = async () => {
        updatePaymentState('submitting', true);
        try {
            // Fetch payment details for Stripe from the backend
            const { clientSecret, orderId } = await fetchStripePaymentDetails({
                cartId: cart._id,
                email: cart.email
            });

            // Update the checkout context with Stripe-specific data
            methods.updateStates('stripe', { client_secret: clientSecret, orderID: orderId });

            console.log(`Redirecting to Stripe with clientSecret: ${clientSecret}`);
        } catch (error) {
            console.error('Error during Stripe payment:', error);
        } finally {
            updatePaymentState('submitting', false);
        }
    };

    /**
     * Handles cryptocurrency payments using the Droplinked Web3 package.
     * @param selectedMethod - Selected payment method containing paymentType and token.
     */
    const processCryptoPayment = async ({
        selected_method: { name: paymentType, token }
    }: Pick<ICheckoutState, 'selected_method'>) => {
        if (!paymentType) return;

        updatePaymentState('submitting', true);

        try {
            // Authenticate and connect to the user's wallet using Web3
            const chainProvider = web3.web3Instance({
                method: Web3Actions.LOGIN,
                chain: Chain.BINANCE,
                preferredWallet: ChainWallet.Metamask
            });

            const loginData = await chainProvider.walletLogin();
            const walletAddress: string = loginData?.address;

            if (!walletAddress) throw new Error('Wallet connection failed');

            // Request a crypto payment initiation from the backend
            const checkoutResponse = await checkoutCryptoPaymentService({
                cartId: cart._id,
                paymentType,
                token,
                email: cart.email,
                walletAddress
            });

            if (checkoutResponse) {
                // Trigger the payment process using Droplinked Web3
                const paymentProcessor = web3.web3Instance({
                  method: Web3Actions.LOGIN,
                  chain: Chain.BINANCE,
                  preferredWallet: ChainWallet.Metamask
                });

                const paymentResult = await paymentProcessor.payment(checkoutResponse?.paymentData);

                // Submit the order after successful payment
                await submitOrderService({
                    chain: paymentType.toLowerCase(),
                    deploy_hash: paymentResult?.transactionHash,
                    orderID: checkoutResponse?.orderID,
                    cryptoAmount: parseInt(paymentResult?.cryptoAmount)
                });

                // Redirect the user to the order confirmation page
                router.push(`/checkout/${checkoutResponse?.orderID}`);
            }
        } catch (error) {
            console.error('Error during crypto payment:', error);
        } finally {
            updatePaymentState('submitting', false);
        }
    };

    return {
        processPayment,
        paymentState,
        processCryptoPayment,
        processStripePayment
    };
}
