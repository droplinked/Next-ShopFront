import { IAppRadioInput } from "@/components/shared/input/radio/interface";
import { ICartShippingData } from "@/types/interfaces/cart/cart";

export interface IEachShippingRadio extends IAppRadioInput{
    shippingData: ICartShippingData
}