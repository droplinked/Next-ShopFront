import { APP_DEVELOPMENT } from "@/lib/variables/variables";
import { Partialize } from "@/types/custom/customize";
import { ORDER_STATUS_ENUM } from "@/types/enums/order/order";
import { PaymentTypes } from "@/types/enums/web3/web3";

namespace deployHashModel {
    export const deploy_hash_link = (hash: string, chain: keyof Partialize<PaymentTypes>) => {
        console.log(hash, chain)
        const URL_MAPPINGS: { [propname in keyof Partialize<PaymentTypes>]: { main: string; test: string } | null } = {
            XRPLSIDECHAIN: { main: `https://evm-sidechain.xrpl.org/tx/${hash}`, test: `https://evm-sidechain.xrpl.org/tx/${hash}` },
            RIPPLESIDECHAIN: { main: `https://evm-sidechain.xrpl.org/tx/${hash}`, test: `https://evm-sidechain.xrpl.org/tx/${hash}` },
            POLYGON: { main: `https://polygonscan.com/tx/${hash}`, test: `https://mumbai.polygonscan.com/tx/${hash}` },
            BINANCE: { main: `https://bscscan.com/tx/${hash}`, test: `https://testnet.bscscan.com/tx/${hash}` },
            BASE: { main: `https://base.blockscout.com/tx/${hash}`, test: `https://base-goerli.blockscout.com/tx/${hash}` },
            LINEA: { main: `https://lineascan.build/tx/${hash}`, test: `https://goerli.lineascan.build/tx/${hash}` },
            NEAR: { main: `https://explorer.mainnet.aurora.dev/tx/${hash}`, test: `https://explorer.aurora.dev/tx/${hash}` },
            ETH: { main: `https://etherscan.io/tx/${hash}`, test: `https://sepolia.etherscan.io/tx/${hash}` },
        };
        return APP_DEVELOPMENT ? URL_MAPPINGS[chain]?.test : URL_MAPPINGS[chain]?.main;
    };

    const defaults = { title: "Order Submitted!", style: "" };
    const canceled = { title: "Payment Failed!", style: "text-[#FF665C]" };
    const success = { title: "Payment Successful!", style: "text-[#1EB41E]" };

    export const status_design = (status: string) => {
        switch (status) {
            case ORDER_STATUS_ENUM.PAYMENT_CONFIRMED:
                return success
            case ORDER_STATUS_ENUM.WAITING_FOR_CONFIRMATION:
            case ORDER_STATUS_ENUM.INITIALIZED_FOR_PAYMENT:
            case ORDER_STATUS_ENUM.PROCESSING:
            case ORDER_STATUS_ENUM.SENT:
                return defaults
            case ORDER_STATUS_ENUM.WAITING_FOR_PAYMENT:
            case ORDER_STATUS_ENUM.CANCELED:
            case ORDER_STATUS_ENUM.CANCELED_PAYMENT_TIMEOUT:
            case ORDER_STATUS_ENUM.REFUNDED:
            case ORDER_STATUS_ENUM.IN_CART:
                return canceled
            default: return defaults
        }
    };
}

export default deployHashModel;
