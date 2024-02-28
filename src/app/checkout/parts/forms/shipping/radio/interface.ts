import { ICartShippingData } from "@/lib/stores/app/interfaces/cart";

export interface IEachShippingRadio extends React.InputHTMLAttributes<HTMLInputElement>{
    shippingData: ICartShippingData
}