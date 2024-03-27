import { Partialize } from "@/types/custom/customize";
import { ORDER_STATUS_ENUM } from "@/types/enums/order/order";
import { PaymentTypes } from "@/types/enums/web3/web3";

export interface IOrder {
    details: IOrderDetails;
    items: IOrderItem[];
}

export interface IOrderDetails {
    orderId: string;
    shipping: number;
    items: number;
    tax: number;
    totalCost: number;
    status: ORDER_STATUS_ENUM;
    paymentType: string;
    chain: keyof Partialize<PaymentTypes>;
    deployHash: string | undefined;
    address: string;
}

export interface IOrderItem {
    _id: string;
    productId: string;
    title: string;
    image: string;
    size: string;
    color: string;
    quantity: number;
    price: number;
    shippingType: string;
}
