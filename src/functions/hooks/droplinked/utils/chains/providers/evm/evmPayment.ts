import { ethers } from "ethers";
import { Chain, Network, getEmptyProof } from "../../Chains";
import { getContractABI, getContractAddress } from "./evmConstants";
import { IChainPayment } from "lib/chains/chainProvider";

export let EVMPayment = async function (provider: any, chain: Chain, network: Network, address: string, data: IChainPayment) {
    if (data.proof === undefined)
        data.proof = getEmptyProof();
    const signer = provider.getSigner();
    if ((await signer.getAddress()).toLocaleLowerCase() != address.toLocaleLowerCase())
        throw new Error("Address does not match signer address");
    
    const contract = new ethers.Contract(await getContractAddress(chain, network), await getContractABI(chain), signer);
    try {
        let tx = await contract.droplinkedPurchase(data.shopWallet, data.chainLinkRoundId, data.tbdValues, data.tbdReceivers, data.cartItems, data.proof, data.memo, {
            gasLimit: 3000000,
            value: data.totalPrice
        });
        return {deploy_hash: tx.hash, cryptoAmount: data.totalPrice};
    } catch (e: any) {
        throw e;
    }
}