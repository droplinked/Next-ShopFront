import { IM2MProps } from "@/lib/apis/cart/interface"

export interface IAddToCart {
    skuID: string
    quantity: number
    m2m_data?: IM2MProps
}


