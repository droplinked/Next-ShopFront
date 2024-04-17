import { CryptoPaymentTypes } from "@/types/enums/web3/web3";

export interface ICreateAddressService {
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2: string;
    country: string | null;
    city: string | null;
    state: string | null;
    zip: string;
    addressType?: string;
}

export interface IAddAddressToCartService {
    cartId: string;
    addressBookID: string;
}

export interface IAddShippingToCartService {
    cartId: string;
    rates: IShippingRates[];
}

export interface IShippingRates {
    groupId: string;
    shipmentId: string;
}

export interface IAddEmailToCartService {
    cartId: string;
    email: string;
}

interface _IGetLocationsList {
    name: string;
}
export interface IGetCountriesList extends _IGetLocationsList {}
export interface IGetCitiesList extends _IGetLocationsList {
    country_id: number;
}

export interface IApplyGiftCardService {
    cartId: string;
    code: string;
}

export interface IStripeClientSecretService {
    cartId: string;
    email: string;
}

export interface ICheckoutCryptoPaymentService {
    cartId: string;
    paymentType: keyof CryptoPaymentTypes;
    token: string;
    email?: string;
    walletAddress: string;
}

export interface ISubmitOrderService {
    chain: string;
    deploy_hash: string;
    cryptoAmount: string;
    orderID: string;
}
