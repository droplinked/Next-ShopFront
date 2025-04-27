import { IAppRadioInput } from "@/components/ui/input/radio/interface";
import { ICartShippingData } from "@/types/interfaces/cart/cart";

export interface IShippingMethodOption extends IAppRadioInput{
    shippingData: ICartShippingData
}

export interface IShippingGroupProps {
    groupId: string;
}