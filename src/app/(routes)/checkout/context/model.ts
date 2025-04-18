import { ICheckoutStatus } from '@/state/hooks/checkout/interface';

namespace checkoutPageModel {
  export const currentStep = ({ email, address, shipping }: ICheckoutStatus) =>
    email && address ? (shipping ? 'payment' : 'shipping') : 'address';
}
export default checkoutPageModel;
