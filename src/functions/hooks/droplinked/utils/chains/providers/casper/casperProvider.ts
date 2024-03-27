import { Chain, ChainWallet, Network } from "../../Chains";
import { ChainProvider, IChainPayment } from "../../chainProvider";
import { casperPayment } from "./casperPayment";
import { casper_login } from "./casperWalletAuth";

export class CasperProvider implements ChainProvider{
    network: Network = Network.TESTNET;
    chain: Chain = Chain.CASPER;
    address: string = "";
    constructor(_chain: Chain, _network: Network) {
        this.chain = _chain;
        this.network = _network;
    }
    async walletLogin(): Promise<any> {
        return await casper_login();
    }
    async payment(data: IChainPayment): Promise<{deploy_hash: string, cryptoAmount: any}> {
        return await casperPayment(this.network, this.address, data);
    }
    setAddress(address: string): ChainProvider {
        this.address = address;
        return this;
    }
    setWallet(wallet: ChainWallet){
        // currently only casper wallet is handled
        return this;
    }
}