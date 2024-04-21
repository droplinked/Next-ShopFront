import { Buffer } from "buffer";
import { Chain, Network } from "../../Chains";

let chainNames = {
  [Chain.BINANCE]: {
    [Network.TESTNET]: {
      chainName: "Smart Chain - Testnet",
      chainId: "0x61",
      nativeCurrency: { name: "BNB", decimals: 18, symbol: "BNB" },
      rpcUrls: ["https://data-seed-prebsc-1-s1.binance.org:8545/"],
    },
    [Network.MAINNET]: {
      chainName: "Smart Chain",
      chainId: "0x38",
      nativeCurrency: { name: "BNB", decimals: 18, symbol: "BNB" },
      rpcUrls: ["https://bsc-dataseed.binance.org/"],
    },
  },
  [Chain.POLYGON]: {
    [Network.TESTNET]: {
      chainName: "Mumbai",
      chainId: "0x13881",
      nativeCurrency: { name: "MATIC", decimals: 18, symbol: "MATIC" },
      rpcUrls: ["https://rpc-mumbai.maticvigil.com"],
    },
    [Network.MAINNET]: {
      chainName: "Polygon Mainnet",
      chainId: "0x89",
      nativeCurrency: { name: "MATIC", decimals: 18, symbol: "MATIC" },
      rpcUrls: ["https://polygon-rpc.com/"],
    },
  },
  [Chain.XRPLSIDECHAIN]: {
    [Network.TESTNET]: {
      chainName: "XRPL EVM Sidechain",
      chainId: "0x15f902",
      nativeCurrency: { name: "XRP", decimals: 18, symbol: "XRP" },
      rpcUrls: ["https://rpc-evm-sidechain.xrpl.org"],
    },
    [Network.MAINNET]: {
      chainName: "XRPL EVM Sidechain",
      chainId: "0x15f902",
      nativeCurrency: { name: "XRP", decimals: 18, symbol: "XRP" },
      rpcUrls: ["https://rpc-evm-sidechain.xrpl.org"],
    },
  },
  [Chain.CASPER]: {
    [Network.TESTNET]: {
      chainName: "",
      chainId: "",
      nativeCurrency: { name: "", decimals: 0, symbol: "" },
      rpcUrls: [""],
    },
    [Network.MAINNET]: {
      chainName: "",
      chainId: "",
      nativeCurrency: { name: "", decimals: 0, symbol: "" },
      rpcUrls: [""],
    },
  },
  [Chain.STACKS]: {
    [Network.TESTNET]: {
      chainName: "Smart Chain - Testnet",
      chainId: "0x38",
      nativeCurrency: { name: "BNB", decimals: 18, symbol: "BNB" },
      rpcUrls: ["https://data-seed-prebsc-1-s1.binance.org:8545/"],
    },
    [Network.MAINNET]: {
      chainName: "Smart Chain",
      chainId: "0x61",
      nativeCurrency: { name: "BNB", decimals: 18, symbol: "BNB" },
      rpcUrls: ["https://data-seed-prebsc-1-s1.binance.org:8545/"],
    },
  },
  [Chain.NEAR]: {
    [Network.TESTNET]: {
      chainName: "Aurora Testnet",
      chainId: "0x4e454153",
      nativeCurrency: { name: "ETH", decimals: 18, symbol: "ETH" },
      rpcUrls: ["https://testnet.aurora.dev"],
    },
    [Network.MAINNET]: {
      chainName: "Aurora Mainnet",
      chainId: "0x4e454152",
      nativeCurrency: { name: "ETH", decimals: 18, symbol: "ETH" },
      rpcUrls: ["https://mainnet.aurora.dev"],
    },
  },
  [Chain.SKALE]: {
    [Network.TESTNET]: {
      chainName: "staging | CHAOS Testnet",
      chainId: "0x50877ED6",
      nativeCurrency: { name: "sFUEL", decimals: 18, symbol: "sFUEL" },
      rpcUrls: [
        "https://staging-v3.skalenodes.com/v1/staging-fast-active-bellatrix",
      ],
    },
    [Network.MAINNET]: {
      chainName: "Smart Chain",
      chainId: "0x61",
      nativeCurrency: { name: "BNB", decimals: 18, symbol: "BNB" },
      rpcUrls: ["https://data-seed-prebsc-1-s1.binance.org:8545/"],
    },
  },
  [Chain.BASE]: {
    [Network.TESTNET]: {
      chainName: "Base Göerli",
      chainId: "0x14a33",
      nativeCurrency: { name: "ETH", decimals: 18, symbol: "ETH" },
      rpcUrls: ["https://goerli.base.org"],
    },
    [Network.MAINNET]: {
      chainName: "Base Mainnet",
      chainId: "0x2105",
      nativeCurrency: { name: "ETH", decimals: 18, symbol: "ETH" },
      rpcUrls: ["https://mainnet.base.org/"],
    },
  },
  [Chain.LINEA]: {
    [Network.MAINNET]: {
      chainName: "Linea",
      chainId: "0xe708",
      nativeCurrency: { name: "ETH", decimals: 18, symbol: "LineaETH" },
      rpcUrls: ["https://rpc.linea.build"],
    },
    [Network.TESTNET]: {
      chainName: "Linea",
      chainId: "0xe704",
      nativeCurrency: { name: "ETH", decimals: 18, symbol: "LineaETH" },
      rpcUrls: ["https://rpc.goerli.linea.build"],
    },
  },
  [Chain.ETH]: {
    [Network.MAINNET]: {
      chainName: "Ethereum",
      chainId: "0x1",
      nativeCurrency: { name: "ETH", decimals: 18, symbol: "ETH" },
      rpcUrls: ["https://mainnet.infura.io/v3/"],
    },
    [Network.TESTNET]: {
      chainName: "Sepolia",
      chainId: "0xaa36a7",
      nativeCurrency: { name: "ETH", decimals: 18, symbol: "ETH" },
      rpcUrls: ["https://eth-sepolia.public.blastapi.io/"],
    },
  },
  [Chain.SOLANA]: {
    // Solana is not evm but i have to put something here
    [Network.TESTNET]: {
      chainName: "",
      chainId: "",
      nativeCurrency: { name: "", decimals: 0, symbol: "" },
      rpcUrls: [""],
    },
    [Network.MAINNET]: {
      chainName: "",
      chainId: "",
      nativeCurrency: { name: "", decimals: 0, symbol: "" },
      rpcUrls: [""],
    },
  },
};

export const isMetamaskInstalled = (): boolean => {
  const { ethereum } = window as any;
  return Boolean(ethereum && ethereum.isMetaMask);
};
export const isCoinBaseInstalled = (): boolean => {
  const { ethereum } = window as any;
  return Boolean(
    ethereum &&
      ethereum.providers.find((x: any) => {
        return x.isCoinbaseWallet;
      }) !== -1
  );
};

export async function getAccounts(ethereum: any) {
  return await ethereum.request({ method: "eth_accounts" });
}

export async function isWalletConnected(ethereum: any) {
  let accounts = await getAccounts(ethereum);
  return accounts && accounts[0] > 0;
}

export async function isChainCorrect(
  ethereum: any,
  chain: Chain,
  network: Network
) {
  let chainId = await ethereum.request({ method: "eth_chainId" });
  return (
    String(chainId).toLowerCase() ===
    chainNames[chain][network].chainId.toLowerCase()
  );
}

export async function changeChain(
  ethereum: any,
  chain: Chain,
  network: Network
) {
  await ethereum.request({
    method: "wallet_switchEthereumChain",
    params: [{ chainId: chainNames[chain][network].chainId }],
  });
}

async function requestAccounts(ethereum: any) {
  try {
    return await ethereum.request({ method: "eth_requestAccounts" });
  } catch (error) {
    console.error(error);
  }
}

export async function getBalance(
  provider: any,
  address: string
): Promise<number> {
  return Number(
    await provider.provider.request({
      method: "eth_getBalance",
      params: [address, "latest"],
    })
  );
}

export async function evmLogin(
  provider: any,
  chain: Chain,
  network: Network
): Promise<{
  address: string;
  signature: string;
}> {
  const ethereum = provider.provider;
  if (!isMetamaskInstalled()) {
    throw "Wallet is not installed";
  }
  if (!(await isWalletConnected(ethereum))) {
    await requestAccounts(ethereum);
  }
  let address = (await getAccounts(ethereum))[0];
  try {
    await ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainName: chainNames[chain][network].chainName,
          chainId: chainNames[chain][network].chainId,
          nativeCurrency: chainNames[chain][network].nativeCurrency,
          rpcUrls: chainNames[chain][network].rpcUrls,
        },
      ],
    });
  } catch (err) {}
  await changeChain(ethereum, chain, network);
  const siweMessage = `Please sign this message to let droplinked view your PublicKey & Address and validate your identity`;
  let msg = `0x${Buffer.from(siweMessage, "utf8").toString("hex")}`;
  const signature = await ethereum.request({
    method: "personal_sign",
    params: [msg, address],
  });
  return {
    address: address,
    signature: signature,
  };
}
