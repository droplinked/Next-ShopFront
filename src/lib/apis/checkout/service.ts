import { fetchInstance } from '../fetch-config';
import {
  IAddAddressToCartService,
  IAddEmailToCartService,
  IAddShippingToCartService,
  IApplyGiftCardService,
  ICheckoutCryptoPaymentService,
  ICreateAddressService,
  IGetCitiesList,
  IGetCountriesList,
  IStripeClientSecretService,
  ISubmitOrderService
} from './interface';

// Address-related services
export const createAddressService = (body: ICreateAddressService) =>
  fetchInstance(`customer/address`, {
    method: 'POST',
    body: JSON.stringify(body)
  });

export const addAddressToCartService = ({ cartId, ...body }: IAddAddressToCartService) =>
  fetchInstance(`checkout/address/${cartId}`, {
    method: 'POST',
    body: JSON.stringify(body)
  });

export const addEmailToCartService = ({ cartId, ...body }: IAddEmailToCartService) =>
  fetchInstance(`cart/email/${cartId}`, {
    method: 'PATCH',
    body: JSON.stringify(body)
  });

export const addShippingToCartService = ({ cartId, rates }: IAddShippingToCartService) =>
  fetchInstance(`checkout/shipping-rates/${cartId}`, {
    method: 'POST',
    body: JSON.stringify({ rates })
  });

// Location-related services
export const getCountriesService = ({ name }: IGetCountriesList) =>
  fetchInstance(`locations/countries`, {
    next: { revalidate: 3600 }
  });

export const getCitiesService = ({ name, country_id }: IGetCitiesList) =>
  fetchInstance(`locations/cities?name=${name}&country_id=${country_id}`, {
    next: { revalidate: 3600 }
  });

// Gift card service
export const applyGiftCardService = (body: IApplyGiftCardService) =>
  fetchInstance(`apply/giftcard`, {
    method: 'PATCH',
    body: JSON.stringify(body)
  });

export const fetchStripePaymentDetails = async ({cartId, ...body}: IStripeClientSecretService): Promise<{
  totalPrice: number;
  clientSecret: string;
  orderId: string;
  currency: string;
  convertedAmount: number;
  conversionRate: number;
}> => {
  try {
    const response = await fetchInstance(`checkout/stripe/${cartId}`, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  ;
    const { totalPrice, client_secret, orderID, currency, convertedAmount, conversionRate } = response;
    return {
      totalPrice,
      clientSecret: client_secret,
      orderId: orderID,
      currency,
      convertedAmount,
      conversionRate
    };
  } catch (error) {
    console.error('Error in fetchStripePaymentDetails:', error);
    throw error; 
  }
};

export const checkoutCryptoPaymentService = ({ cartId, paymentType, token, ...body }: ICheckoutCryptoPaymentService) =>
  fetchInstance(`checkout/${cartId}/payment/${paymentType}/${token}`, {
    method: 'POST',
    body: JSON.stringify(body)
  });

export const submitOrderService = ({ chain, ...body }: ISubmitOrderService) =>
  fetchInstance(`public/payment/${chain}`, {
    method: 'POST',
    body: JSON.stringify(body)
  });
