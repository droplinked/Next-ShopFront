export interface ICart {
    _id: string;
    status: string;
    shopID: string;
    ownerID: string;
    checkoutAddressID: string;
    items: ICartItem[];
    paymentIntent: PaymentIntent;
    shipmentRates: ShipmentRates;
    selectedShipmentRate: number;
    selectedShipmentRateID: string;
    shipmentData: ShipmentData;
    availableShipmentRates: string[];
    selectedShipmentRates: number;
    selectedShipmentRateIDs: string[];
    shipmentInformation: string[];
    totalCart: ITotalCart
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

export interface ITotalCart{
    subtotal: number;
    shipping: number;
    estimatedTaxes: number;
    giftCard: {
        type: any,
        amount: 0
    },
    totalPayment: number;
}


interface PaymentIntent {}

interface ShipmentRates {}

interface ShipmentData {}
