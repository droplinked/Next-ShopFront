import AppIcons from '@/assets/AppIcons';
import { AppButton, AppLinkButton } from '@/components/ui';
import useAppCart from '@/state/hooks/cart/useAppCart';
import useAppStore from '@/lib/stores/app/appStore';
import { cn } from '@/lib/utils/cn/cn';
import { app_center, app_vertical } from '@/lib/variables/variables';
import { useFormik } from 'formik';
import { toast } from 'sonner';
import { initial_shipping } from '../../../schema/schema';
import ShippingMethodOption from './components/shipping-method-option';
import ShippingGroupProducts from './components/shipping-group-products';

const CheckoutShipping = () => {
  const {states: { cart } } = useAppStore();
  const { addShippingToCart } = useAppCart();

  const { values, setValues, handleSubmit, isSubmitting, setSubmitting } = useFormik({
    initialValues: initial_shipping(cart?.shippings),
    enableReinitialize: true,
    validateOnChange: false,
    onSubmit: (values) => {
      toast.promise(
        addShippingToCart({ cartId: cart._id, rates: values }).finally(() => setSubmitting(false)),
        { loading: 'Adding shipping to cart...', success: `Successfully added shipping(s) to your cart`, error: 'Something went wrong' }
      );
    }
  });


  return (
    <form className={cn(app_vertical, 'gap-6')} onSubmit={handleSubmit}>
      <div className={cn(app_vertical, 'border rounded-sm p-6 gap-6 w-full')}>
        {cart?.shippings.map((shipping, index) => (
          <div key={shipping.groupId} className={cn(app_vertical, 'w-full gap-4')}>
            <ShippingGroupProducts groupId={shipping.groupId} />
            {shipping.data.map((data) => (
              <ShippingMethodOption
                key={`${data.id}`}
                shippingData={data}
                checked={values[index].shipmentId === data.id && values[index].groupId === shipping.groupId}
                onChange={() => setValues((prev) => prev.map((item, idx) => (idx === index ? { groupId: shipping.groupId, shipmentId: data.id } : item)))}
              />
            ))}
          </div>
        ))}
      </div>
      <div className={cn(app_center, 'w-full justify-between')}>
        <AppLinkButton disabled={isSubmitting} href={'/'} appButtonProps={{ appVariant: 'filled', appClassName: cn(app_center, 'rounded-sm py-3 px-4 text-sm font-normal') }}>
          Back to shop
        </AppLinkButton>
        <AppButton
          loading={isSubmitting}
          disabled={values.length !== cart?.shippings?.length || isSubmitting}
          appClassName={cn('py-3 pr-4 pl-4 rounded-sm', !isSubmitting && 'pl-9')}
          type="submit"
          hasIcon
        >
          Next
          <AppIcons.Arrow className="stroke-disabled-foreground" />
        </AppButton>
      </div>
    </form>
  );
};

export default CheckoutShipping;
