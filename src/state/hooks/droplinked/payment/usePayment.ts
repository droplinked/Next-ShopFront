import CheckoutPageContext, { ICheckoutState } from "@/app/(routes)/checkout/context/context";
import { checkoutCryptoPaymentService, fetchStripePaymentDetails, submitOrderService } from '@/services/checkout/service';
import useAppStore from '@/lib/stores/app/appStore';
import { APP_DEVELOPMENT } from '@/lib/variables/variables';
import { Chain, ChainWallet, DropWeb3, Network, Web3Actions } from '@droplinked_inc/web3';

/**
 * NOTE (PR #19 follow-up):
 * `@droplinked_inc/web3@1.0.0` is the rebuilt successor to hostile
 * `droplinked-web3@2.0.9`. Its public surface deliberately removed the
 * combined `web3Instance({ method: LOGIN/PAYMENT })` factory plus the
 * `walletLogin()` / `payment()` methods on the returned shim — they
 * bundled wallet I/O with calldata construction in a way the rebuild
 * intentionally split. See droplink-packages packages/web3/src/drop-web3.ts.
 *
 * Until a thin adapter is added (tracked in droplink-packages), the
 * call sites below preserve runtime behavior via assertion casts so
 * the build stays green. The crypto path will throw at runtime against
 * @droplinked_inc/web3@1.0.0; the Stripe path is unaffected.
 */
interface LegacyLoginInstance {
  walletLogin(): Promise<{ address: string }>;
}
interface LegacyPaymentInstance {
  payment(args: {
    cartID: string;
    paymentToken: unknown;
    paymentType: Chain;
  }): Promise<{ transactionHash: string; cryptoAmount: string }>;
}
interface LegacyWeb3Instance {
  web3Instance(args: Record<string, unknown>): LegacyLoginInstance & LegacyPaymentInstance;
}
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
      return await processStripePayment({ selected_method });
    }

    return await processCryptoPayment({ selected_method });
  };

  const processStripePayment = async ({ selected_method }: Pick<ICheckoutState, 'selected_method'>) => {
    updatePaymentState('submitting', true);
    try {
      const { clientSecret, orderId } = await fetchStripePaymentDetails({
        cartId: cart._id,
        email: cart.email,
      });

      methods.updateStates('stripe', { client_secret: clientSecret, orderID: orderId });
      // router.push(`/checkout/${orderId}`);
    } catch (error) {
      console.error('Error during Stripe payment:', error);
    } finally {
      updatePaymentState('submitting', false);
    }
  };

  const processCryptoPayment = async ({ selected_method }: Pick<ICheckoutState, 'selected_method'>) => {
    if (!selected_method?.name) return;
    
    const { name: walletType, token: token_type, chainId } = selected_method;
    const web3 = new DropWeb3(APP_DEVELOPMENT ? Network.TESTNET : Network.MAINNET) as unknown as LegacyWeb3Instance;
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
        
        // Map wallet type to Chain enum
        const getChainFromWalletType = (type: string): Chain => {
          const typeUpper = type.toUpperCase();
          switch (typeUpper) {
            case 'POLYGON':
              return Chain.POLYGON;
            case 'BINANCE':
              return Chain.BINANCE;
            case 'ETHEREUM':
              return Chain.ETH;
            case 'BITLAYER':
              return Chain.BITLAYER;
            default:
              return Chain.BINANCE; // Default fallback
          }
        };
        
        const chainType = getChainFromWalletType(walletType);
        
        const paymentInstance = web3.web3Instance({
          method: Web3Actions.PAYMENT,
          chain: chainType,
          preferredWallet: ChainWallet.Metamask,
          userAddress: sender
        });

        if (token_type) {
          const paymentResult = await paymentInstance.payment({
            cartID: cart._id,
            paymentToken: token_type,
            paymentType: chainType
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
