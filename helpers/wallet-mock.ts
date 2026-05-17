import type { Page } from '@playwright/test';

/**
 * Mock window.ethereum + WalletConnect-style providers.
 *
 * Tests assert UI intent only — DO NOT execute real transactions. The
 * mock returns canned responses for the common provider methods.
 *
 * Inject BEFORE page navigation so wagmi/ethers/etc. see the provider
 * during their boot phase.
 */

export interface MockWalletOptions {
  address?: string;
  chainId?: number; // hex string in actual provider; we accept number for ergonomics
  shouldReject?: boolean; // simulate user-rejected transaction
}

const DEFAULT_ADDRESS = '0x0000000000000000000000000000000000000001';
const DEFAULT_CHAIN_ID = 8453; // Base mainnet

/**
 * Inject a mock EIP-1193 provider as window.ethereum.
 */
export async function injectMockWallet(
  page: Page,
  options: MockWalletOptions = {},
): Promise<void> {
  const {
    address = DEFAULT_ADDRESS,
    chainId = DEFAULT_CHAIN_ID,
    shouldReject = false,
  } = options;

  await page.addInitScript(({ address, chainId, shouldReject }) => {
    const chainIdHex = `0x${chainId.toString(16)}`;
    const listeners = new Map<string, Array<(...args: any[]) => void>>();

    const provider = {
      isMetaMask: true,
      isCoinbaseWallet: false,
      isWalletConnect: false,
      chainId: chainIdHex,
      selectedAddress: address,

      async request({ method, params }: { method: string; params?: any[] }) {
        if (shouldReject) {
          throw { code: 4001, message: 'User rejected the request.' };
        }
        switch (method) {
          case 'eth_chainId':
            return chainIdHex;
          case 'eth_accounts':
          case 'eth_requestAccounts':
            return [address];
          case 'wallet_switchEthereumChain':
            return null;
          case 'personal_sign':
            return '0x' + '00'.repeat(65);
          case 'eth_sendTransaction':
            return '0x' + 'aa'.repeat(32);
          case 'eth_signTypedData_v4':
            return '0x' + 'bb'.repeat(65);
          default:
            console.warn('[mock-wallet] unmocked method:', method);
            return null;
        }
      },

      on(event: string, handler: (...args: any[]) => void) {
        if (!listeners.has(event)) listeners.set(event, []);
        listeners.get(event)!.push(handler);
      },

      removeListener(event: string, handler: (...args: any[]) => void) {
        const list = listeners.get(event);
        if (!list) return;
        const idx = list.indexOf(handler);
        if (idx >= 0) list.splice(idx, 1);
      },
    };

    (window as any).ethereum = provider;
  }, { address, chainId, shouldReject });
}

/**
 * Inject a "no wallet" state — for testing the "install MetaMask" CTA.
 */
export async function injectNoWallet(page: Page): Promise<void> {
  await page.addInitScript(() => {
    delete (window as any).ethereum;
  });
}
