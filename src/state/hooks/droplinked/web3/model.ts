import AppWalletIcons from "@/assets/icons/wallets/AppWalletIcons";

namespace useWeb3HookModel {
    export const display_options = {
        POLYGON: {
            description: "Make payment directly using",
            icon: { light: AppWalletIcons.PolygonPayment, dark: AppWalletIcons.PolygonPayment },
            enum_number: 0,
        },
        BINANCE: {
            description: "Make payment directly using",
            icon: { light: AppWalletIcons.BinancePayment, dark: AppWalletIcons.BinancePayment },
            enum_number: 1,
        },
        XRPLSIDECHAIN: {
            description: "Make payment directly using",
            icon: { light: AppWalletIcons.XrplSidechainPayment, dark: AppWalletIcons.XrplSidechainPayment },
            enum_number: 3,
        },
        RIPPLESIDECHAIN: {
            description: "Make payment directly using",
            icon: { light: AppWalletIcons.XrplSidechainPayment, dark: AppWalletIcons.XrplSidechainPayment },
            enum_number: 3,
        },
        NEAR: {
            description: "Make payment directly using",
            icon: { light: AppWalletIcons.NearPayment, dark: AppWalletIcons.NearPayment },
            enum_number: 4,
        },
        BASE: {
            description: "Make payment directly using",
            icon: { light: AppWalletIcons.BasePayment, dark: AppWalletIcons.BasePayment },
            enum_number: 6,
        },
        LINEA: {
            description: "Make payment directly using",
            icon: { light: AppWalletIcons.LinaePayment, dark: AppWalletIcons.LinaePayment },
            enum_number: 7,
        },
        ETH: {
            description: "Make payment directly using",
            icon: { light: AppWalletIcons.ETHPayment, dark: AppWalletIcons.ETHPayment },
            enum_number: 8,
        },
        SOLANA: {
            description: "Make payment directly using",
            icon: { light: AppWalletIcons.SolanaPayment, dark: AppWalletIcons.SolanaPayment },
            enum_number: 9,
        },
    };
}
export default useWeb3HookModel;
