import AppIcons from '@/assets/AppIcons';
import droplinked from '@/assets/icons/droplinked.png';
import AppWalletIcons from '@/assets/icons/wallets/AppWalletIcons';
import { AppSeparator, AppTypography } from '@/components/ui';
import AppShow from '@/components/ui/show/AppShow';
import useAppStore from '@/lib/stores/app/appStore';
import { cn } from '@/lib/utils/cn/cn';
import { app_center, APP_DEVELOPMENT, app_vertical, hide } from '@/lib/variables/variables';
import { DroplinkedPaymentIntent } from 'droplinked-payment-intent';
import Image from 'next/image';
import { useRouter } from 'next/navigation'
import { toast } from 'sonner';


const PaymentModal = ({ stripe }: { stripe: { client_secret: string; orderID: string } }) => {
  const router = useRouter();
  const {states: {cart: { totalCart } }} = useAppStore();

  return (
    <div className={'flex grow p-9 gap-6 justify-center items-start'}>
      <div className={cn(app_vertical, 'gap-9 items-start justify-between w-full self-stretch')}>
        <Image src={droplinked} alt="Site Logo" className="h-12 object-contain" width={100} height={32} />
        <AppShow
          show={{
            when: stripe?.client_secret && stripe?.orderID && stripe?.client_secret !== '' && stripe?.orderID !== '',
            then: (
              <DroplinkedPaymentIntent
                clientSecret={stripe.client_secret}
                type={"stripe"}
                isTestnet={APP_DEVELOPMENT}
                return_url={`${window.location.origin}/orders/${stripe?.orderID}`}
                onSuccess={() => {
                  toast.success('Payment successful');
                }}
                onError={() => {
                  toast.error('Something went wrong with the payment');
                }}
                onCancel={() => {
                  toast.info('Payment cancelled');
                }}
                commonStyle={{
                  backgroundBody: "#fff",
                  colorContainer: "#fff",
                  textColorLabel: "#000",
                  colorInput:"#fff",
                  textColorInput: "#000",
                  colorBorderInput:  "#F2F2F2",
                  borderRadius: "8px",
                  cancelButton: {
                    backgroundColor: "#F2F2F2",
                    borderRadius: "8px",
                    textColor: "#000",
                  },
                  submitButton: {
                    backgroundColor:  "#000",
                    borderRadius: "8px",
                    textColor:  "#fff"
                  },
                  verticalPadding: "1rem",
                  theme: "light"
                }}
              />
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
