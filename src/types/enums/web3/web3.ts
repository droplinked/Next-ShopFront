enum CryptoEnum {
  CRYPTO = 'CRYPTO'
}
enum XummEnum {
  XUMM = 'XUMM'
}
enum UnisatEnum {
  UNISAT = 'UNISAT'
}
enum MultiWalletEnum {
  UNSTOPPABLEDOMAIN = 'UNSTOPPABLEDOMAIN'
}
enum LeatherEnum {
  STACK = 'STACK'
}
enum PhantomEnum {
  SOLANA = 'SOLANA'
}
enum MetamaskEnum {
  POLYGON = 'POLYGON',
  XRPLSIDECHAIN = 'XRPLSIDECHAIN',
  RIPPLESIDECHAIN = 'RIPPLESIDECHAIN',
  BINANCE = 'BINANCE',
  NEAR = 'NEAR',
  BASE = 'BASE',
  LINEA = 'LINEA',
  ETH = 'ETH'
}
enum TokenEnum {
  USDT = 'USDT',
  USDC = 'USDC',
  BINANCE_PEG_BSC_USD = 'BINANCE_PEG_BSC_USD',
  CSPR = 'CSPR',
  MATIC = 'MATIC',
  BNB = 'BNB',
  XRP = 'XRP',
  ETH = 'ETH',
  MEW = 'MEW',
  NEAR = 'NEAR'
}
export enum WalletTypes {
  MULTIWALLET = 'MULTIWALLET',
  XUMM = 'XUMM',
  METAMASK = 'METAMASK'
}
export type TokenTypes = typeof TokenEnum;
export type TypeOfPayment = typeof CryptoEnum;
export type LoginTypes = typeof MetamaskEnum & typeof MultiWalletEnum & typeof LeatherEnum & typeof XummEnum & typeof UnisatEnum;
export type CryptoPaymentTypes = typeof MetamaskEnum & typeof PhantomEnum;
export type PaymentTypes = CryptoPaymentTypes & { STRIPE: 'STRIPE' };
export type M2MTypes = typeof MetamaskEnum & typeof MultiWalletEnum;
