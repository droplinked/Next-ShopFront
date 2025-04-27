'use client';
import useAppStore from '@/lib/stores/app/appStore';
import useAppCheckout from '@/state/hooks/checkout/useAppCheckout';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import CheckoutLoading from './components/checkout-loading/CheckoutLoading';
import CheckoutAddress from './components/forms/address/checkout-address';
import CheckoutShipping from './components/forms/shipping/checkout-shipping';
import CheckoutPageContext, { ICheckoutState, initialCheckout } from './context/context';
import checkoutPageModel from './context/model';


const CheckoutSummary = dynamic(() => import('./components/summary/CheckoutSummary'), {
  ssr: false,
  loading: () => <CheckoutLoading />
});

const CheckoutPayment = dynamic(() => import('./components/forms/payment/checkout-payment'), {
  ssr: false,
  loading: () => <CheckoutLoading />
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
    loading: { form: <CheckoutLoading /> },
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
  }, [cart?._id, cart?.items, status, router, currentStep]);

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
