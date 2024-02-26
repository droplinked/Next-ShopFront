export interface IAddToCartService {
    cartId: string;
    shopID: string;
    skuID: string;
    quantity: number;
    m2m_data?: IM2MProps;
}

export interface ICahngeQuantityService extends Omit<IAddToCartService, "m2m_data"> {
    itemId: string;
}

export interface IGetCartService {
    cartId: string;
}

export interface IM2MProps {
    m2m_position: string;
    print_url: string;
}
