import CheckoutPageContext, { ICheckoutState } from "@/app/(routes)/checkout/context/context";
import { checkoutCryptoPaymentService, fetchStripePaymentDetails, submitOrderService } from '@/services/checkout/service';
import useAppStore from '@/lib/stores/app/appStore';
import { APP_DEVELOPMENT } from '@/lib/variables/variables';
import { Chain, ChainWallet, DropWeb3, Network, Web3Actions, PaymentTokens } from 'droplinked-web3';
import { useRouter } from 'next/navigation';
import { useContext, useState, useTransition } from 'react';

export function usePayment() {
  const router = useRouter();
  const [paymentState, setPaymentState] = useState({ submitting: false });
  const [isPending, startTransition] = useTransition();
  const { states: { cart }} = useAppStore();
  const { methods } = useContext(CheckoutPageContext);

  const updatePaymentState = (key: string, value: any) => startTransition(() => setPaymentState((prev) => ({ ...prev, [key]: value })));

  const processPayment = async ({ selected_method }: Pick<ICheckoutState, 'selected_method'>) => {
    if (!selected_method?.name) return;

    if (selected_method.name === 'STRIPE') {
      return await processStripePayment();
    }

    return await processCryptoPayment({ selected_method });
  };

  const processStripePayment = async () => {
    updatePaymentState('submitting', true);
    try {
      const { clientSecret, orderId } = await fetchStripePaymentDetails({
        cartId: cart._id,
        email: cart.email
      });

      methods.updateStates('stripe', { client_secret: clientSecret, orderID: orderId });
      // router.push(`/checkout/${orderId}`);
    } catch (error) {
      console.error('Error during Stripe payment:', error);
    } finally {
      updatePaymentState('submitting', false);
    }
  };

  const processCryptoPayment = async ({ selected_method: { name: walletType, token: token_type } }: Pick<ICheckoutState, 'selected_method'>) => {
    if (!walletType) return;

    const web3 = new DropWeb3(APP_DEVELOPMENT ? Network.TESTNET : Network.MAINNET);
    updatePaymentState('submitting', true);

    try {
      const loginInstance = web3.web3Instance({
        method: Web3Actions.LOGIN,
        preferredWallet: ChainWallet.Metamask
      });

      const loginData = await loginInstance.walletLogin();
      const sender: string = loginData?.address;

      if (!sender) throw new Error('Wallet connection failed');

      const checkoutResponse = await checkoutCryptoPaymentService({
        cartId: cart._id,
        paymentType: walletType,
        token: token_type,
        email: cart.email,
        walletAddress: sender
      });

      if (checkoutResponse) {
        const { orderID } = await checkoutResponse.json(); // Parse the response JSON to extract orderID
        const paymentInstance = web3.web3Instance({
          method: Web3Actions.PAYMENT,
          chain: Chain.BINANCE, // TODO: Update chain dynamically
          preferredWallet: ChainWallet.Metamask,
          userAddress: sender
        });

        if (token_type) {
          const paymentResult = await paymentInstance.payment({
            cartID: cart._id,
            paymentToken: PaymentTokens[token_type],
            paymentType: Chain.BINANCE
          });

          await submitOrderService({
            chain: walletType.toLowerCase(),
            deploy_hash: paymentResult?.transactionHash,
            orderID: orderID,
            cryptoAmount: parseInt(paymentResult?.cryptoAmount)
          });

          router.push(`/checkout/${orderID}`);
        }
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
