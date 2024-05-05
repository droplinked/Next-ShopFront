import { Partialize } from "@/types/custom/customize";
import { PaymentTypes, TokenTypes } from "@/types/enums/web3/web3";

export interface IShop {
    _id: string;
    name: string;
    ownerID: string;
    addressBookID: string;
    templateID: string;
    template_options: any;
    description: string;
    shopifyDomain: string;
    shopDomain: string[];
    dnsData: IDNSData;
    headerIcon: string;
    textColor: string;
    backgroundColor: string;
    backgroundText: string;
    theme: string;
    backgroundImage: string;
    backgroundImageSecondary: string;
    infoEmail: string;
    instagramURL: string;
    discordURL: string;
    twitterURL: string;
    facebookURL: string;
    linkedinURL: string;
    tiktokURL: string;
    logo: string;
    webURL: string;
    productsTags: string[];
    imsType: string;
    tags: string[];
    loginMethods: string[];
    shopDesign: any;
    credit: number;
    expressStripeAccountId: string;
    onboardedExpressStripeAccount: boolean;
    apiKey: string;
    privateKey: string;
    hasCustomDomain: boolean;
    paymentMethods: IPaymentMethods[];
    oauth2Client: any;
}

export interface IPaymentMethods {
    _id: string;
    isActive: boolean;
    type: keyof Partialize<PaymentTypes>;
    destinationAddress?: string;
    chainId: string;
    tokens: {
        _id: string;
        isActive: boolean;
        tokenId: string;
        type: keyof Partialize<TokenTypes>
    }[]
}
interface IDNSData {
    domain_name: string;
    NS_records: string[];
    existed_before: boolean;
}

export const initialShop: IShop = {
    _id: "",
    name: "",
    ownerID: "",
    addressBookID: "",
    templateID: "",
    template_options: {},
    description: "",
    shopifyDomain: "",
    shopDomain: [""],
    dnsData: {
        domain_name: "",
        NS_records: [""],
        existed_before: false,
    },
    headerIcon: "",
    textColor: "",
    backgroundColor: "",
    backgroundText: "",
    theme: "",
    backgroundImage: "",
    backgroundImageSecondary: "",
    infoEmail: "",
    instagramURL: "",
    discordURL: "",
    twitterURL: "",
    facebookURL: "",
    linkedinURL: "",
    tiktokURL: "",
    logo: "",
    webURL: "",
    productsTags: [""],
    imsType: "",
    tags: [""],
    loginMethods: [""],
    shopDesign: {},
    credit: 0,
    expressStripeAccountId: "",
    onboardedExpressStripeAccount: false,
    apiKey: "",
    privateKey: "",
    hasCustomDomain: false,
    paymentMethods: [],
    oauth2Client: {},
};
