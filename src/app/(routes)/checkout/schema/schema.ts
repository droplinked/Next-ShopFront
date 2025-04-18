import { ICartAddress, ICartShippings } from '@/types/interfaces/cart/cart';
import { string, object, mixed } from 'yup';

export const address_schema = () =>
  object().shape({
    email: string().required('Required'),
    firstName: string().required('Required'),
    lastName: string().required('Required'),
    addressLine1: string().required('Required'),
    state: string().required('Required'),
    country: string().required('Required'),
    city: string().required('Required'),
    zip: string().required('Required'),
    addressShop: mixed().oneOf(['SHOP'])
  });

export const initial_address = ({ address, email }: { address: Omit<ICartAddress, '_id' | 'ownerID' | 'easyPostAddressID'>; email: string }) => ({
  email: email || '',
  firstName: address?.firstName || '',
  lastName: address?.lastName || '',
  addressLine1: address?.addressLine1 || '',
  addressLine2: address?.addressLine2 ? address?.addressLine2 : '',
  country: address?.country ? address?.country : null,
  city: address?.city || null,
  state: address?.state || null,
  zip: address?.zip || '',
  addressType: 'SHOP'
});

export const initial_shipping = (shippings: ICartShippings[]) =>
  shippings?.map((shipping) => shipping.data[0] && { groupId: shipping.groupId, shipmentId: shipping.data[0].id }) || { groupId: '', shipmentId: '' };

export const giftcard_schema = () => object().shape({ code: string().required() });

export const initial_giftcard = { code: '' };
