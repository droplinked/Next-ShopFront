'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import CheckoutPageContext, { ICheckoutState, initialCheckout } from './context';
import useAppCheckout from '@/functions/hooks/checkout/useAppCheckout';
import checkoutPageModel from './model';
import CheckoutAddress from './parts/forms/address/checkout-address';
import CheckoutShipping from './parts/forms/shipping/checkout-shipping';
import L_Checkout from '@/components/loading/checkout';
import useAppStore from '@/lib/stores/app/appStore';

// Dynamically import payment-related components
const CheckoutSummary = dynamic(() => import('./parts/summary/checkout-summary'), {
  ssr: false,
  loading: () => <L_Checkout />
});

const CheckoutPayment = dynamic(() => import('./parts/forms/payment/checkout-payment'), {
  ssr: false,
  loading: () => <L_Checkout />
});

function CheckoutPage() {
  const [states, setStates] = useState<ICheckoutState>(initialCheckout);
  const router = useRouter();
  const { status } = useAppCheckout();
  const {
    states: { cart }
  } = useAppStore();
  const { currentStep } = checkoutPageModel;

  const updateStates = (key: string, value: any) => {
    setStates((prev) => ({ ...prev, [key]: value }));
  };

  // Define steps and their corresponding forms
  const steps = {
    loading: { form: <L_Checkout /> },
    address: { form: <CheckoutAddress /> },
    shipping: { form: <CheckoutShipping /> },
    payment: { form: <CheckoutPayment /> }
  };

  // Redirect if cart is empty, otherwise update the step
  useEffect(() => {
    if (!cart?._id) {
      router.push('/');
    } else {
      updateStates('step', currentStep(status));
    }
  }, [cart?.items, status, router]);

  // Render the checkout page
  return (
    <CheckoutPageContext.Provider value={{ states, methods: { updateStates } }}>
      {cart?._id && (
        <main className="container flex items-start justify-between gap-12 pt-20">
          <div className="min-w-[70%]">{steps[states.step]?.form}</div>
          <div className="min-w-[30%] sticky left-0 top-24">
            <CheckoutSummary />
          </div>
        </main>
      )}
    </CheckoutPageContext.Provider>
  );
}

export default CheckoutPage;
