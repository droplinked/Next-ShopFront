import { Partialize } from "@/types/custom/customize";
import { LoginTypes, PaymentTypes, TokenTypes, TypeOfPayment, WalletTypes } from "@/types/enums/web3/web3";

export type ILoginDroplinked = {
    [propname in WalletTypes]: {
        wallet: string;
        chains: {
            [propname in keyof Partialize<LoginTypes>]: {
                caption: string;
                method: Function;
                icon: { dark: string; light: string };
            };
        };
    };
};

export type PaymentDroplinkedOptions = {
    label: string;
    description: string;
    icon: { dark: string; light: string };
    token?: keyof Partialize<TokenTypes>;
    enum_number?: number
};

export type IPaymentDroplinked = {
    type: string;
    options: { [propname in keyof Partialize<PaymentTypes>]: PaymentDroplinkedOptions }[];
};
