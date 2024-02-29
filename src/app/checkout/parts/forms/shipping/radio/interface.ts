import { ICartShippingData } from "@/types/interfaces/cart/cart";

export interface IEachShippingRadio extends React.InputHTMLAttributes<HTMLInputElement>{
    shippingData: ICartShippingData
}