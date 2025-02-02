import { AppButton, AppDialog, AppProductSummary, AppSeparator } from '@/components/shared';
import useAppStore from '@/lib/stores/app/appStore';
import { cn } from '@/lib/utils/cn/cn';
import { app_vertical } from '@/lib/variables/variables';
import { roboto } from '@/styles/fonts';
import { SummaryFooter, SummaryGiftCardForm } from './parts';
import PaymentModal from './parts/modal/payment-modal';
import AppShow from '@/components/shared/show/AppShow';
import { useContext } from 'react';
import CheckoutPageContext from '../../context';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { usePayment } from '@/functions/hooks/droplinked/payment/usePayment';

const CheckoutSummary = () => {
  const {
    states: {
      cart: { items, totalCart }
    }
  } = useAppStore();

  const {
    states: { selected_method, step, stripe }
  } = useContext(CheckoutPageContext);

  const dialogState = usePopupState({ variant: 'popover', popupId: 'droplinked-popup-popover' });
  const { processPayment, paymentState } = usePayment();

  // Fixed the onClick handler
  const handleClick = async () => {
    await processPayment({ selected_method });
    if (selected_method.name === 'STRIPE') dialogState.open();
  };

  return (
    <section className={cn(app_vertical, 'self-stretch gap-6')}>
      {/* Order Summary Section */}
      <aside className={cn(app_vertical, 'border rounded-sm p-6 gap-6 w-full')}>
        <h1 className={cn('font-semibold text-base text-foreground text-left w-full', roboto.className)}>Order Summary</h1>
        {/* Displaying Items */}
        <div className={cn(app_vertical, 'gap-6 w-full')}>
          {items?.map(({ product, options, totals, _id }) => (
            <AppProductSummary
              key={_id}
              details={{
                size: options?.size?.caption,
                color: options?.color?.caption,
                quantity: options?.quantity,
                priceItem: totals?.priceItem,
                image: product?.image,
                title: product?.title
              }}
            />
          ))}
        </div>
        <AppSeparator />
        {/* Gift Card Form */}
        <SummaryGiftCardForm />
        <AppSeparator />
        {/* Footer with Total */}
        <SummaryFooter totalCart={totalCart} />
      </aside>

      {/* Payment Section */}
      <AppShow
        show={{
          when: step === 'payment',
          then: (
            <AppDialog
              props={{
                dialogState: dialogState,
                trigger: (
                  <AppButton type="button" appClassName="w-full" appSize="lg" disabled={!selected_method?.name} onClick={handleClick} loading={paymentState.submitting}>
                    Pay ${totalCart?.totalPayment} USD
                  </AppButton>
                ),
                content: {
                  children: <PaymentModal stripe={stripe} />
                }
              }}
            />
          )
        }}
      />
    </section>
  );
};
export default CheckoutSummary;