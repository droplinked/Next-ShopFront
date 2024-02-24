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
}

interface ICartItem {
    skuID: string;
    quantity: number;
}

interface PaymentIntent {}

interface ShipmentRates {}

interface ShipmentData {}
