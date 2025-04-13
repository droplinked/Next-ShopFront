import {
  IAddAddressToCartService,
  IAddEmailToCartService,
  IAddShippingToCartService,
  IApplyGiftCardService,
  ICheckoutCryptoPaymentService,
  ICreateAddressService,
  IGetCitiesList,
  IStripeClientSecretService,
  ISubmitOrderService
} from './interface';

// Address-related services
export const createAddressService = (body: ICreateAddressService) =>
  fetch(`/api/customer/address`, {
    method: 'POST',
    body: JSON.stringify(body)
  });

export const addAddressToCartService = ({ cartId, ...body }: IAddAddressToCartService) =>
  fetch(`/api/checkout/address/${cartId}`, {
    method: 'POST',
    body: JSON.stringify(body)
  });

export const addEmailToCartService = ({ cartId, ...body }: IAddEmailToCartService) =>
  fetch(`/api/cart/${cartId}/email`, {
    method: 'PATCH',
    body: JSON.stringify(body)
  });

export const addShippingToCartService = ({ cartId, rates }: IAddShippingToCartService) =>
  fetch(`/api/checkout/shipping-rates/${cartId}`, {
    method: 'POST',
    body: JSON.stringify({ rates })
  });

// Location-related services
export const getCountriesService = () =>
  fetch(`/api/checkout/countries`, {
    next: { revalidate: 3600 }
  });

export const getCitiesService = ({ name, country_name }: IGetCitiesList) =>
  fetch(`/api/checkout/cities?name=${name || ''}&country_name=${country_name || ''}`, {
    next: { revalidate: 3600 }
  });

// Gift card service
export const applyGiftCardService = (body: IApplyGiftCardService) =>
  fetch(`/api/checkout/giftcard`, {
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
    const response = await fetch(`/api/checkout/stripe/${cartId}`, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  
    const { totalPrice, client_secret, orderID, currency, convertedAmount, conversionRate } = await response.json();
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
  fetch(`/api/checkout/${cartId}/payment/${paymentType}/${token}`, {
    method: 'POST',
    body: JSON.stringify(body)
  });

export const submitOrderService = ({ chain, ...body }: ISubmitOrderService) =>
  fetch(`/api/checkout/payment/${chain}`, {
    method: 'POST',
    body: JSON.stringify(body)
  });
