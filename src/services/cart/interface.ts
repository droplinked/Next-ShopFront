export interface IAddToCartService {
    cartId: string;
    shopID: string;
    skuID: string;
    quantity: number;
    m2m_data?: IM2MProps;
}

export interface IChangeQuantityService extends Omit<IAddToCartService, "m2m_data"> {
    itemId: string;
}

export interface IGetCartService {
    cartId: string;
}

export interface IGetPaymentMethodsService {
    cartId: string;
}

export interface IUpdateCartDetailsService {
    cartId: string;
    email: string;
    addressId?: string;
    note?: string;
}

export interface IM2MProps {
    m2m_position: string;
    print_url: string;
}
