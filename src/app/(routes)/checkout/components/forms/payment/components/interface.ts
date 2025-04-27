import { IAppRadioInput } from "@/components/ui/input/radio/interface";
import { IPaymentDroplinked, PaymentDroplinkedOptions } from "@/state/hooks/droplinked/web3/interfaces";
import { Partialize } from "@/types/custom/customize";
import { PaymentTypes } from "@/types/enums/web3/web3";
import { IPaymentMethod } from "@/types/interfaces/shop/shop";

export interface IPaymentMethodOption extends IAppRadioInput {
    method: {
        type: string;
        displayName: string;
        isActive: boolean;
        token?: string;
        stripeType?: string;
        chainId?: string;
        supportedChains: Array<{
            type: string;
            isActive: boolean;
        }>;
    };
}
