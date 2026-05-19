import AppIcons from '@/assets/AppIcons';
import droplinked from '@/assets/icons/droplinked.png';
import AppWalletIcons from '@/assets/icons/wallets/AppWalletIcons';
import { AppSeparator, AppTypography } from '@/components/ui';
import AppShow from '@/components/ui/show/AppShow';
import useAppStore from '@/lib/stores/app/appStore';
import { cn } from '@/lib/utils/cn/cn';
import { app_center, app_vertical, hide } from '@/lib/variables/variables';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe, Stripe, Appearance } from '@stripe/stripe-js';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

// Stripe publishable key (publishable keys are safe to expose client-side).
// Loaded once at module scope so the Promise is reused across renders, per
// the @stripe/stripe-js documentation.
const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';
const stripePromise: Promise<Stripe | null> | null = STRIPE_PUBLISHABLE_KEY
  ? loadStripe(STRIPE_PUBLISHABLE_KEY)
  : null;

// Common style props preserved from the previous (droplinked-payment-intent)
// API surface so callers do not need to change. Mapped onto Stripe Elements
// `appearance` at render time.
type CommonStyle = {
  backgroundBody?: string;
  colorContainer?: string;
  textColorLabel?: string;
  colorInput?: string;
  textColorInput?: string;
  colorBorderInput?: string;
  borderRadius?: string;
  cancelButton?: { backgroundColor?: string; borderRadius?: string; textColor?: string };
  submitButton?: { backgroundColor?: string; borderRadius?: string; textColor?: string };
  verticalPadding?: string;
  theme?: 'light' | 'dark';
};

const COMMON_STYLE: CommonStyle = {
  backgroundBody: '#fff',
  colorContainer: '#fff',
  textColorLabel: '#000',
  colorInput: '#fff',
  textColorInput: '#000',
  colorBorderInput: '#F2F2F2',
  borderRadius: '8px',
  cancelButton: { backgroundColor: '#F2F2F2', borderRadius: '8px', textColor: '#000' },
  submitButton: { backgroundColor: '#000', borderRadius: '8px', textColor: '#fff' },
  verticalPadding: '1rem',
  theme: 'light',
};

function toStripeAppearance(style: CommonStyle): Appearance {
  return {
    theme: style.theme === 'dark' ? 'night' : 'stripe',
    variables: {
      colorBackground: style.colorContainer,
      colorText: style.textColorLabel,
      colorTextSecondary: style.textColorLabel,
      borderRadius: style.borderRadius,
      spacingUnit: style.verticalPadding,
    },
    rules: {
      '.Input': {
        backgroundColor: style.colorInput ?? '#fff',
        color: style.textColorInput ?? '#000',
        border: `1px solid ${style.colorBorderInput ?? '#F2F2F2'}`,
        borderRadius: style.borderRadius ?? '8px',
      },
      '.Label': {
        color: style.textColorLabel ?? '#000',
      },
    },
  };
}

interface StripePaymentFormProps {
  return_url: string;
  onSuccess: () => void;
  onError: () => void;
  onCancel: () => void;
  commonStyle: CommonStyle;
}

function StripePaymentForm({ return_url, onSuccess, onError, onCancel, commonStyle }: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !complete) return;
    setSubmitting(true);
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url },
        redirect: 'if_required',
      });
      if (error) {
        onError();
      } else {
        onSuccess();
      }
    } catch {
      onError();
    } finally {
      setSubmitting(false);
    }
  };

  const submitStyle: React.CSSProperties = {
    backgroundColor: commonStyle.submitButton?.backgroundColor ?? '#000',
    borderRadius: commonStyle.submitButton?.borderRadius ?? '8px',
    color: commonStyle.submitButton?.textColor ?? '#fff',
    padding: '0.75rem 1.25rem',
    border: 'none',
    cursor: complete && !submitting ? 'pointer' : 'not-allowed',
    opacity: complete && !submitting ? 1 : 0.6,
    width: '100%',
    fontWeight: 600,
  };
  const cancelStyle: React.CSSProperties = {
    backgroundColor: commonStyle.cancelButton?.backgroundColor ?? '#F2F2F2',
    borderRadius: commonStyle.cancelButton?.borderRadius ?? '8px',
    color: commonStyle.cancelButton?.textColor ?? '#000',
    padding: '0.75rem 1.25rem',
    border: 'none',
    cursor: 'pointer',
    minWidth: '8rem',
    fontWeight: 600,
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
      <PaymentElement onChange={(e) => setComplete(e.complete)} />
      <div className="flex w-full gap-4">
        <button type="button" style={cancelStyle} onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" style={submitStyle} disabled={!stripe || !elements || !complete || submitting}>
          {submitting ? 'Processing…' : 'Pay'}
        </button>
      </div>
    </form>
  );
}


const PaymentModal = ({ stripe }: { stripe: { client_secret: string; orderID: string } }) => {
  const router = useRouter();
  const {states: {cart: { totalCart } }} = useAppStore();

  const hasIntent = Boolean(stripe?.client_secret && stripe?.orderID && stripe.client_secret !== '' && stripe.orderID !== '');
  const appearance = useMemo(() => toStripeAppearance(COMMON_STYLE), []);
  const elementsOptions = useMemo(
    () => (hasIntent ? { clientSecret: stripe.client_secret, appearance } : null),
    [hasIntent, stripe?.client_secret, appearance]
  );

  return (
    <div className={'flex grow p-9 gap-6 justify-center items-start'}>
      <div className={cn(app_vertical, 'gap-9 items-start justify-between w-full self-stretch')}>
        <Image src={droplinked} alt="Site Logo" className="h-12 object-contain" width={100} height={32} />
        <AppShow
          show={{
            when: hasIntent && Boolean(stripePromise) && Boolean(elementsOptions),
            then: (
              <Elements stripe={stripePromise} options={elementsOptions!}>
                <StripePaymentForm
                  return_url={typeof window !== 'undefined' ? `${window.location.origin}/orders/${stripe?.orderID}` : `/orders/${stripe?.orderID}`}
                  onSuccess={() => {
                    toast.success('Payment successful');
                  }}
                  onError={() => {
                    toast.error('Something went wrong with the payment');
                  }}
                  onCancel={() => {
                    toast.info('Payment cancelled');
                    router.back();
                  }}
                  commonStyle={COMMON_STYLE}
                />
              </Elements>
            )
          }}
        />
      </div>
      <section className={cn(app_vertical, 'p-12 gap-12 bg-[#F3F5FA] rounded-sm min-h-full self-stretch')}>
        <article className={cn(app_vertical, 'gap-6')}>
          <AppTypography appClassName="font-normal">Total Payment</AppTypography>
          <AppTypography appClassName="text-3xl" price usd="ml-1 text-base font-normal text-gray-500">
            {totalCart?.totalPayment}
          </AppTypography>
          <div className={cn(app_center, 'gap-2')}>
            <AppIcons.Shield />
            <AppTypography className="font-normal text-nowrap">Secure Payment with</AppTypography>
            <AppWalletIcons.StripePayment />
          </div>
        </article>
        <AppSeparator appClassName={cn(hide.below.sm, 'w-full border-[#E2E6EA]')} />
        <aside className={cn(app_vertical, hide.below.sm, 'gap-4 self-stretch')}>
          <AppShow
            show={[
              {
                when: totalCart?.giftCard?.totalBalance ?? false,
                then: (
                  <div className={cn(app_center, 'justify-between w-full')}>
                    <AppTypography appClassName="font-normal">Applied discount code</AppTypography>
                    <AppTypography price usd="text-gray-500 ml-1" appClassName="font-normal">
                      {totalCart.giftCard.totalBalance?.toFixed(2)}
                    </AppTypography>
                  </div>
                )
              },
              {
                when: totalCart?.shipping ?? false,
                then: (
                  <div className={cn(app_center, 'justify-between w-full')}>
                    <AppTypography appClassName="font-normal">Total Shipping</AppTypography>
                    <AppTypography price usd="text-gray-500 ml-1" appClassName="font-normal">
                      {totalCart.shipping?.toFixed(2)}
                    </AppTypography>
                  </div>
                )
              },
              {
                when: totalCart?.subtotal ?? false,
                then: (
                  <div className={cn(app_center, 'justify-between w-full')}>
                    <AppTypography appClassName="font-normal">Total cart</AppTypography>
                    <AppTypography price usd="text-gray-500 ml-1" appClassName="font-normal">
                      {totalCart.subtotal?.toFixed(2)}
                    </AppTypography>
                  </div>
                )
              },
              {
                when: totalCart?.estimatedTaxes ?? false,
                then: (
                  <div className={cn(app_center, 'justify-between w-full')}>
                    <AppTypography appClassName="font-normal">Tax</AppTypography>
                    <AppTypography price usd="text-gray-500 ml-1" appClassName="font-normal">
                      {totalCart.estimatedTaxes?.toFixed(2)}
                    </AppTypography>
                  </div>
                )
              }
            ]}
          />
        </aside>
      </section>
    </div>
  );
};

export default PaymentModal;
