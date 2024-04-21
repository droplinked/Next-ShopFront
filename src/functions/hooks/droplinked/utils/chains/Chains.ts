export enum Chain {
  CASPER,
  POLYGON,
  BINANCE,
  STACKS,
  XRPLSIDECHAIN,
  NEAR,
  SKALE,
  BASE,
  LINEA,
  ETH,
  SOLANA,
}

export type Proof = {
  _pA: [number, number];
  _pB: [[number, number], [number, number]];
  _pC: [number, number];
  _pubSignals: [number, number, number];
  provided: boolean;
};

export function getEmptyProof() {
  let _proof: Proof = {
    _pA: [0, 0],
    _pB: [
      [0, 0],
      [0, 0],
    ],
    _pC: [0, 0],
    _pubSignals: [0, 0, 0],
    provided: false,
  };
  return _proof;
}

export enum ChainWallet {
  Metamask,
  CoinBase,
  CasperWallet,
  PhantomWallet,
}

export enum Network {
  MAINNET,
  TESTNET,
}
export enum ProductType {
  DIGITAL,
  POD,
  PHYSICAL,
}

export type Beneficiary = {
  isPercentage: boolean;
  value: number;
  wallet: string;
};
