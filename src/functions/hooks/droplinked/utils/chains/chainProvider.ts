import { Chain, Network, Proof, getEmptyProof, ChainWallet } from "./Chains";
import { CasperProvider } from "./providers/casper/casperProvider";
import { EVMProvider } from "./providers/evm/evmProvider";
import { SolanaProvider } from "./providers/solana/solanaProvider";

export class WalletNotFoundException {
  public readonly message: string = "";
  constructor(field: string) {
    this.message = field;
  }
}
export class AccountChangedException {
  public readonly message: string = "";
  constructor(field: string) {
    this.message = field;
  }
}

export class ChainNotImplementedException {
  public readonly message: string = "";
  constructor(field: string) {
    this.message = field;
  }
}

export interface IChainPayment {
  shopWallet: string;
  chainLinkRoundId: string;
  totalPrice: any;
  tbdValues: number[];
  tbdReceivers: string[];
  cartItems: { id: number; amount: number; isAffiliate: boolean }[];
  proof: Proof | undefined;
  memo: string;
}

export interface ChainProvider {
  walletLogin(): Promise<any>;
  payment(
    data: IChainPayment
  ): Promise<{ deploy_hash: string; cryptoAmount: any }>;
  paymentWithToken(
    receiver: string,
    amount: number,
    tokenAddress: string
  ): Promise<string>;
  setAddress(address: string): ChainProvider;
  setWallet(wallet: ChainWallet): ChainProvider;
}

let chainMapping = {
  [Chain.BINANCE]: {
    [Network.TESTNET]: new EVMProvider(Chain.BINANCE, Network.TESTNET),
    [Network.MAINNET]: new EVMProvider(Chain.BINANCE, Network.MAINNET),
  },
  [Chain.POLYGON]: {
    [Network.TESTNET]: new EVMProvider(Chain.POLYGON, Network.TESTNET),
    [Network.MAINNET]: new EVMProvider(Chain.POLYGON, Network.MAINNET),
  },
  [Chain.NEAR]: {
    [Network.TESTNET]: new EVMProvider(Chain.NEAR, Network.TESTNET),
    [Network.MAINNET]: new EVMProvider(Chain.NEAR, Network.MAINNET),
  },
  [Chain.CASPER]: {
    [Network.TESTNET]: new CasperProvider(Chain.CASPER, Network.TESTNET),
    [Network.MAINNET]: new CasperProvider(Chain.CASPER, Network.MAINNET),
  },
  [Chain.XRPLSIDECHAIN]: {
    [Network.TESTNET]: new EVMProvider(Chain.XRPLSIDECHAIN, Network.TESTNET),
    [Network.MAINNET]: new EVMProvider(Chain.XRPLSIDECHAIN, Network.MAINNET),
  },
  [Chain.STACKS]: {
    [Network.TESTNET]: null,
    [Network.MAINNET]: null,
  },
  [Chain.SKALE]: {
    [Network.TESTNET]: new EVMProvider(Chain.SKALE, Network.TESTNET),
    [Network.MAINNET]: new EVMProvider(Chain.SKALE, Network.MAINNET),
  },
  [Chain.BASE]: {
    [Network.TESTNET]: new EVMProvider(Chain.BASE, Network.TESTNET),
    [Network.MAINNET]: new EVMProvider(Chain.BASE, Network.MAINNET),
  },
  [Chain.LINEA]: {
    [Network.TESTNET]: new EVMProvider(Chain.LINEA, Network.TESTNET),
    [Network.MAINNET]: new EVMProvider(Chain.LINEA, Network.MAINNET),
  },
  [Chain.ETH]: {
    [Network.TESTNET]: new EVMProvider(Chain.ETH, Network.TESTNET),
    [Network.MAINNET]: new EVMProvider(Chain.ETH, Network.MAINNET),
  },
  [Chain.SOLANA]: {
    [Network.TESTNET]: new SolanaProvider(Chain.SOLANA, Network.TESTNET),
    [Network.MAINNET]: new SolanaProvider(Chain.SOLANA, Network.MAINNET),
  },
};

export function getNetworkProvider(
  chain: Chain,
  network: Network,
  address: string,
  wallet: ChainWallet = ChainWallet.Metamask
) {
  if (chain === Chain.SOLANA && wallet !== ChainWallet.PhantomWallet)
    wallet = ChainWallet.PhantomWallet;
  if (chainMapping[chain][network] == null)
    throw new ChainNotImplementedException(
      "The given chain is not implemented yet"
    );
  return chainMapping[chain][network]?.setAddress(address).setWallet(wallet);
}
