import { IAppRadioInput } from "@/components/shared/input/radio/interface";
import { IPaymentDroplinked, PaymentDroplinkedOptions } from "@/functions/hooks/droplinked/web3/interfaces";
import { Partialize } from "@/types/custom/customize";
import { PaymentTypes } from "@/types/enums/web3/web3";

export interface IEachPaymentRadio extends IAppRadioInput {
    method: {
        options: ({ [propname in keyof Partialize<PaymentTypes>]: PaymentDroplinkedOptions | undefined } | undefined)[];
        type: string;
    };
}
