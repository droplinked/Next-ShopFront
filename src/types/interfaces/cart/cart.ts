export interface ICart {
    _id: string;
    status: string;
    shopID: string;
    ownerID: string;
    address: ICartAddress;
    shippings: ICartShippings[];
    email: string;
    items: ICartItem[];
    paymentIntent: any;
    totalCart: ITotalCart;
    canApplyGiftCard: boolean
}

export interface ICartShippings {
    groupId: string;
    type: string;
    data: ICartShippingData[];
}
export interface ICartShippingData {
    id: string;
    title: string;
    price: number;
    delivery_estimation: string;
    selected: boolean;
}

export interface ISelectedShipmentRate {
    type: string;
    rate: number;
}

interface ICartItemOption {
    caption: string;
    value: string;
}

interface ICartItemProduct {
    _id: string;
    title: string;
    image: string;
    m2m_preview: string | null;
    type: string;
    pre_purchase_data_fetch: string | null;
}

interface ICartItemTotals {
    discountPercentage: number;
    priceItem: number;
    priceItemByDiscount: number;
    subTotal: number;
    shipping: number;
    tax: number;
}

export interface ICartItem {
    _id: string;
    skuID: string;
    groupId: string;
    product: ICartItemProduct;
    options: {
        quantity: number;
        size: ICartItemOption;
        color: ICartItemOption;
    };
    totals: ICartItemTotals;
}

export enum GIFTCARD_ENUM {
    CREDIT = "CREDIT",
    DISCOUNT = "DISCOUNT",
}

export interface IGiftCard {
    _id: string;
    balance: number;
    code: string;
    totalBalance: number;
    amountToBeReduced: number;
    type: GIFTCARD_ENUM;
}

export interface ITotalCart {
    subtotal: number;
    shipping: number;
    estimatedTaxes: number;
    giftCard: IGiftCard;
    totalPayment: number;
}

export interface ICartAddress {
    _id?: string;
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2: string;
    country: string;
    city: string;
    state: string;
    zip: string;
    ownerID?: string;
    addressType?: string;
    easyPostAddressID?: string;
}
