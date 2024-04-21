import { fetchInstance } from "../fetch-config";
import { IAddAddressToCartService, IAddEmailToCartService, IAddShippingToCartService, IApplyGiftCardService, ICheckoutCryptoPaymentService, ICreateAddressService, IGetCitiesList, IGetCountriesList, IStripeClientSecretService, ISubmitOrderService } from "./interface";

export const create_address_service = ({ ...body }: ICreateAddressService) => fetchInstance(`customer/address`, { method: "POST", body: JSON.stringify(body) });
export const add_address_to_cart_service = ({ cartId, ...body }: IAddAddressToCartService) => fetchInstance(`checkout/address/${cartId}`, { method: "POST", body: JSON.stringify(body) });
export const add_email_to_cart_service = ({ cartId, ...body }: IAddEmailToCartService) => fetchInstance(`cart/email/${cartId}`, { method: "PATCH", body: JSON.stringify(body) });
export const add_shipping_to_cart_service = ({ cartId, rates }: IAddShippingToCartService) => fetchInstance(`checkout/shipping-rates/${cartId}`, { method: "POST", body: JSON.stringify({rates}) });
export const get_countries_service = ({ name }: IGetCountriesList) => fetchInstance(`locations/countries`, { next: { revalidate: 3600 } });
export const get_cities_service = ({ name, country_id }: IGetCitiesList) => fetchInstance(`locations/cities?name=${name}&country_id=${country_id}`, { next: { revalidate: 3600 } });
export const apply_giftcard_service = ({...body}: IApplyGiftCardService) => fetchInstance(`apply/giftcard`, { method: "PATCH", body: JSON.stringify(body) });
export const get_stripe_client_secret_service = ({cartId, ...body}: IStripeClientSecretService) => fetchInstance(`checkout/stripe/${cartId}`, {method: "POST", body: JSON.stringify(body)})
export const checkout_crypto_payment_service = ({ cartId, paymentType, token, ...body}: ICheckoutCryptoPaymentService) => fetchInstance(`checkout/${cartId}/payment/${paymentType}/${token}`, {method: "POST", body: JSON.stringify(body)})
export const submit_order_service = ({ chain, ...body }: ISubmitOrderService) => fetchInstance(`public/payment/${chain}`, {method: "POST", body: JSON.stringify(body)})