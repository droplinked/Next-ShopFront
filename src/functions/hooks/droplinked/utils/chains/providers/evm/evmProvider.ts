import { ethers } from "ethers";
import { Chain, ChainWallet, Network } from "../../Chains";
import {
  ChainProvider,
  IChainPayment,
  WalletNotFoundException,
} from "../../chainProvider";
import {
  evmLogin,
  isMetamaskInstalled,
  getAccounts,
  isWalletConnected,
  isChainCorrect,
  changeChain,
} from "./evmLogin";
import { EVMPayment } from "./evmPayment";
import { getERC20TokenTransferABI } from "./evmConstants";

export class EVMProvider implements ChainProvider {
  chain: Chain = Chain.BINANCE;
  network: Network = Network.TESTNET;
  address: string = "";
  wallet: ChainWallet = ChainWallet.Metamask;
  constructor(_chain: Chain, _network: Network) {
    this.chain = _chain;
    this.network = _network;
  }

  async paymentWithToken(
    receiver: string,
    amount: number,
    tokenAddress: string
  ): Promise<string> {
    await this.handleWallet(this.address);
    const abi = getERC20TokenTransferABI();
    const contract = new ethers.Contract(
      tokenAddress,
      abi,
      this.getWalletProvider()
    );
    const tx = await contract.transfer(receiver, amount);
    return tx.hash;
  }

  getWalletProvider() {
    const ethereum = (window as any).ethereum;
    if (!ethereum)
      throw new WalletNotFoundException("No EVM Wallet is installed");
    // multiple wallet installed
    if (ethereum.providerMap) {
      if (this.wallet === ChainWallet.Metamask) {
        if (!ethereum.providerMap.get("MetaMask"))
          throw new WalletNotFoundException("Metamask is not installed");
        return new ethers.providers.Web3Provider(
          ethereum.providers.find((x: any) => {
            return x.isMetaMask;
          })
        );
      } else if (this.wallet === ChainWallet.CoinBase) {
        if (!ethereum.providerMap.get("CoinbaseWallet"))
          throw new WalletNotFoundException("Coinbase wallet not found");
        return new ethers.providers.Web3Provider(
          ethereum.providers.find((x: any) => {
            return x.isCoinbaseWallet;
          })
        );
      } else {
        throw new Error("Wallet not implemented");
      }
    } else {
      // single wallet installed
      if (this.wallet === ChainWallet.CoinBase) {
        if (!(window as any).ethereum.isCoinbaseWallet)
          throw new WalletNotFoundException("Coinbase wallet not found");
      } else if (this.wallet === ChainWallet.Metamask) {
        if (!(window as any).ethereum.isMetaMask)
          throw new WalletNotFoundException("Metamask wallet not found");
      }
      return new ethers.providers.Web3Provider((window as any).ethereum);
    }
  }
  setAddress(address: string): any {
    this.address = address;
    return this;
  }
  setWallet(wallet: ChainWallet): any {
    this.wallet = wallet;
    return this;
  }
  async handleWallet(_address: string) {
    if (!isMetamaskInstalled())
      throw new WalletNotFoundException("Metamask is not installed");
    const provider = this.getWalletProvider();
    const ethereum = provider.provider as any;
    let accs = await getAccounts(ethereum);
    if (!isWalletConnected(ethereum) || accs.length === 0) {
      let { address } = await this.walletLogin();
      if (_address.toLocaleLowerCase() !== address.toLocaleLowerCase()) {
        await (window as any).ethereum.request({
          method: "wallet_requestPermissions",
          params: [
            {
              eth_accounts: {},
            },
          ],
        });
        this.handleWallet(_address);
        // throw new AccountChangedException("The current account on your wallet is not the one you've logged in with!");
      }
    }
    if (!(await isChainCorrect(ethereum, this.chain, this.network))) {
      await changeChain(ethereum, this.chain, this.network);
    }
    if (String(accs[0]).toLocaleLowerCase() !== _address.toLocaleLowerCase()) {
      await (window as any).ethereum.request({
        method: "wallet_requestPermissions",
        params: [
          {
            eth_accounts: {},
          },
        ],
      });
      this.handleWallet(_address);
      // throw new AccountChangedException("The current account on your wallet is not the one you've logged in with!");
    }
  }
  async walletLogin() {
    let { address, signature } = await evmLogin(
      this.getWalletProvider(),
      this.chain,
      this.network
    );
    this.address = address;
    return { address, signature };
  }
  async payment(
    data: IChainPayment
  ): Promise<{ deploy_hash: string; cryptoAmount: any }> {
    await this.handleWallet(this.address);
    return await EVMPayment(
      this.getWalletProvider(),
      this.chain,
      this.network,
      this.address,
      data
    );
  }
}
